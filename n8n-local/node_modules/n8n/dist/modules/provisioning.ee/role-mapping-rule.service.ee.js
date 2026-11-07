"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleMappingRuleService = void 0;
const backend_services_1 = require("@n8n/backend-services");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const errors_1 = require("@n8n/errors");
const role_mapping_rule_validation_1 = require("./role-mapping-rule.validation");
let RoleMappingRuleService = class RoleMappingRuleService {
    constructor(roleMappingRuleRepository, roleRepository, projectRepository, eventService) {
        this.roleMappingRuleRepository = roleMappingRuleRepository;
        this.roleRepository = roleRepository;
        this.projectRepository = projectRepository;
        this.eventService = eventService;
    }
    async list(query) {
        const sortBy = query.sortBy ?? 'order:asc';
        const [sortField, sortDir] = sortBy.split(':');
        const direction = sortDir === 'desc' ? 'DESC' : 'ASC';
        const order = sortField === 'createdAt'
            ? { createdAt: direction, id: 'ASC' }
            : sortField === 'updatedAt'
                ? { updatedAt: direction, id: 'ASC' }
                : { order: direction, id: 'ASC' };
        const where = query.type ? { type: query.type } : {};
        const [entities, count] = await this.roleMappingRuleRepository.findAndCount({
            where,
            relations: ['projects', 'role'],
            order,
            skip: query.skip,
            take: query.take,
        });
        return {
            count,
            items: entities.map((entity) => this.toResponse(entity)),
        };
    }
    async create(dto, user) {
        const uniqueProjectIds = (0, role_mapping_rule_validation_1.assertAndNormalizeProjectIdsForRuleType)(dto.type, dto.projectIds, []);
        const role = await this.roleRepository.findOne({ where: { slug: dto.role } });
        if (!role) {
            throw new errors_1.NotFoundError(`Could not find role with slug "${dto.role}"`);
        }
        (0, role_mapping_rule_validation_1.assertRoleCompatibleWithMappingType)(role, dto.type);
        const projects = uniqueProjectIds.length > 0
            ? await this.projectRepository.findBy({ id: (0, typeorm_1.In)(uniqueProjectIds) })
            : [];
        if (projects.length !== uniqueProjectIds.length) {
            throw new errors_1.BadRequestError('One or more projects were not found');
        }
        const saved = await this.saveWithOrderRetry(dto, role, projects);
        const loaded = await this.roleMappingRuleRepository.findOneOrFail({
            where: { id: saved.id },
            relations: ['projects', 'role'],
        });
        const result = this.toResponse(loaded);
        this.eventService.emit('role-mapping-rule-created', {
            user: { id: user.id, email: user.email },
            ruleId: result.id,
            ruleType: result.type,
            expression: result.expression,
            role: result.role,
        });
        return result;
    }
    async saveWithOrderRetry(dto, role, projects) {
        const maxAttempts = 3;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const existingRules = await this.roleMappingRuleRepository.find({
                where: { type: dto.type },
                select: ['id', 'order'],
                order: { order: 'ASC' },
            });
            const requestedOrder = dto.order ?? existingRules.length;
            const targetIndex = Math.min(Math.max(requestedOrder, 0), existingRules.length);
            const maxOrder = existingRules.length > 0 ? existingRules[existingRules.length - 1].order : -1;
            const tempOrder = Math.max(maxOrder, existingRules.length - 1) + 1;
            const rule = new db_1.RoleMappingRule();
            rule.expression = dto.expression;
            rule.role = role;
            rule.type = dto.type;
            rule.order = tempOrder;
            rule.projects = projects;
            try {
                const saved = await this.roleMappingRuleRepository.save(rule);
                const reorderedIds = existingRules.map((r) => r.id);
                reorderedIds.splice(targetIndex, 0, saved.id);
                await this.applyOrder(reorderedIds);
                return saved;
            }
            catch (error) {
                if (attempt < maxAttempts - 1 && (0, db_1.isUniqueConstraintError)(error)) {
                    continue;
                }
                throw error;
            }
        }
        throw new errors_1.ConflictError('Could not create role mapping rule due to an order conflict');
    }
    async patch({ id, dto, userId, userEmail, }) {
        if (typeof id !== 'string' || id.length === 0) {
            throw new errors_1.BadRequestError('Rule id is required');
        }
        if (dto === undefined || dto === null || Object.keys(dto).length === 0) {
            throw new errors_1.BadRequestError('At least one field is required');
        }
        const rule = await this.roleMappingRuleRepository.findOne({
            where: { id },
            relations: ['projects', 'role'],
        });
        if (!rule) {
            throw new errors_1.NotFoundError('Could not find role mapping rule');
        }
        const originalType = rule.type;
        const mergedType = dto.type ?? originalType;
        const mergedOrder = dto.order ?? rule.order;
        const mergedExpression = dto.expression ?? rule.expression;
        const mergedRoleSlug = dto.role ?? rule.role.slug;
        const fallbackProjectIds = rule.projects.map((p) => p.id);
        const uniqueProjectIds = (0, role_mapping_rule_validation_1.assertAndNormalizeProjectIdsForRuleType)(mergedType, dto.projectIds, fallbackProjectIds);
        const role = mergedRoleSlug === rule.role.slug
            ? rule.role
            : await this.roleRepository.findOne({ where: { slug: mergedRoleSlug } });
        if (!role) {
            throw new errors_1.NotFoundError(`Could not find role with slug "${mergedRoleSlug}"`);
        }
        (0, role_mapping_rule_validation_1.assertRoleCompatibleWithMappingType)(role, mergedType);
        await this.assertOrderAvailable(mergedType, mergedOrder, id);
        const projects = uniqueProjectIds.length > 0
            ? await this.projectRepository.findBy({ id: (0, typeorm_1.In)(uniqueProjectIds) })
            : [];
        if (projects.length !== uniqueProjectIds.length) {
            throw new errors_1.BadRequestError('One or more projects were not found');
        }
        rule.expression = mergedExpression;
        rule.role = role;
        rule.type = mergedType;
        rule.order = mergedOrder;
        rule.projects = projects;
        await this.roleMappingRuleRepository.save(rule);
        await this.normalizeOrderForType(mergedType);
        if (originalType !== mergedType) {
            await this.normalizeOrderForType(originalType);
        }
        const loaded = await this.roleMappingRuleRepository.findOneOrFail({
            where: { id: rule.id },
            relations: ['projects', 'role'],
        });
        const result = this.toResponse(loaded);
        this.eventService.emit('role-mapping-rule-updated', {
            user: { id: userId, email: userEmail },
            ruleId: result.id,
            ruleType: result.type,
            patchedFields: Object.keys(dto),
        });
        return result;
    }
    async delete({ id, userId, userEmail, }) {
        if (typeof id !== 'string' || id.length === 0) {
            throw new errors_1.BadRequestError('Rule id is required');
        }
        const rule = await this.roleMappingRuleRepository.findOne({
            where: { id },
            relations: ['projects', 'role'],
        });
        if (!rule) {
            throw new errors_1.NotFoundError('Could not find role mapping rule');
        }
        const result = this.toResponse(rule);
        await this.roleMappingRuleRepository.remove(rule);
        await this.normalizeOrderForType(result.type);
        this.eventService.emit('role-mapping-rule-deleted', {
            user: { id: userId, email: userEmail },
            ruleId: id,
            ruleType: result.type,
        });
        return result;
    }
    async deleteAllOfType(type, tx) {
        const repo = tx ? tx.getRepository(db_1.RoleMappingRule) : this.roleMappingRuleRepository;
        const result = await repo.delete({ type });
        return result.affected ?? 0;
    }
    async move({ id, targetIndex, userId, userEmail, }) {
        if (typeof id !== 'string' || id.length === 0) {
            throw new errors_1.BadRequestError('Rule id is required');
        }
        const rule = await this.roleMappingRuleRepository.findOne({
            where: { id },
            relations: ['projects', 'role'],
        });
        if (!rule) {
            throw new errors_1.NotFoundError('Could not find role mapping rule');
        }
        const type = rule.type;
        const all = await this.roleMappingRuleRepository.find({
            where: { type },
            select: ['id', 'order'],
            order: { order: 'ASC' },
        });
        const clampedIndex = Math.min(targetIndex, all.length - 1);
        const currentIndex = all.findIndex((r) => r.id === id);
        const reordered = [...all];
        reordered.splice(currentIndex, 1);
        reordered.splice(clampedIndex, 0, all[currentIndex]);
        await this.applyOrder(reordered.map((r) => r.id));
        const loaded = await this.roleMappingRuleRepository.findOneOrFail({
            where: { id },
            relations: ['projects', 'role'],
        });
        const result = this.toResponse(loaded);
        this.eventService.emit('role-mapping-rule-updated', {
            user: { id: userId, email: userEmail },
            ruleId: result.id,
            ruleType: result.type,
            patchedFields: ['order'],
        });
        return result;
    }
    async applyOrder(orderedIds) {
        if (orderedIds.length === 0)
            return;
        await this.roleMappingRuleRepository.manager.transaction(async (tx) => {
            const offset = orderedIds.length + 1000;
            for (let i = 0; i < orderedIds.length; i++) {
                await tx.update(db_1.RoleMappingRule, { id: orderedIds[i] }, { order: offset + i });
            }
            for (let i = 0; i < orderedIds.length; i++) {
                await tx.update(db_1.RoleMappingRule, { id: orderedIds[i] }, { order: i });
            }
        });
    }
    async normalizeOrderForType(type) {
        const rules = await this.roleMappingRuleRepository.find({
            where: { type },
            select: ['id', 'order'],
            order: { order: 'ASC' },
        });
        if (rules.length === 0)
            return;
        if (rules.every((r, i) => r.order === i))
            return;
        await this.applyOrder(rules.map((r) => r.id));
    }
    async assertOrderAvailable(type, order, excludeRuleId) {
        const existingAtOrder = await this.roleMappingRuleRepository.findOne({
            where: { type, order },
        });
        if (existingAtOrder && existingAtOrder.id !== excludeRuleId) {
            throw new errors_1.ConflictError(`A role mapping rule already exists with type "${type}" and order ${order}. Use a different order value.`);
        }
    }
    toResponse(loaded) {
        return {
            id: loaded.id,
            expression: loaded.expression,
            role: loaded.role.slug,
            type: loaded.type,
            order: loaded.order,
            projectIds: loaded.projects.map((p) => p.id),
            createdAt: loaded.createdAt.toISOString(),
            updatedAt: loaded.updatedAt.toISOString(),
        };
    }
};
exports.RoleMappingRuleService = RoleMappingRuleService;
exports.RoleMappingRuleService = RoleMappingRuleService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.RoleMappingRuleRepository, db_1.RoleRepository, db_1.ProjectRepository, backend_services_1.EventService])
], RoleMappingRuleService);
//# sourceMappingURL=role-mapping-rule.service.ee.js.map