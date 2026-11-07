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
exports.SkillsApiService = void 0;
const backend_services_1 = require("@n8n/backend-services");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
const permissions_1 = require("@n8n/permissions");
const check_access_1 = require("../../../permissions.ee/check-access");
const skill_repository_1 = require("../repositories/skill.repository");
const agent_config_hash_1 = require("../utils/agent-config-hash");
const skill_service_1 = require("./skill.service");
const skills_telemetry_1 = require("./skills-telemetry");
function scopeOf(skill) {
    if (skill.agentId)
        return 'agent';
    if (skill.projectId)
        return 'project';
    return 'instance';
}
let SkillsApiService = class SkillsApiService {
    constructor(skillService, skillRepository, projectScopeService, txRunner, userRepository, skillsTelemetry) {
        this.skillService = skillService;
        this.skillRepository = skillRepository;
        this.projectScopeService = projectScopeService;
        this.txRunner = txRunner;
        this.userRepository = userRepository;
        this.skillsTelemetry = skillsTelemetry;
    }
    async list(user, query) {
        if (query.attachableTo !== undefined && (query.scope || query.projectId)) {
            throw new errors_1.UserError('Filter by attachableTo alone, without scope or projectId.');
        }
        const projectIds = await this.projectScopeService.getProjectIds(user, ['projectSkill:list']);
        const attachableTo = await this.attachTarget(query.attachableTo);
        const { skills, count } = await this.skillRepository.findVisiblePage({ projectIds: projectIds ?? 'all' }, {
            scope: query.scope,
            projectId: query.projectId,
            attachableTo,
            search: query.search,
            skip: query.skip,
            take: query.take,
        });
        return { count, data: await this.toListItems(user, skills) };
    }
    async get(user, skillId) {
        return await this.toDetail(user, await this.requireAccess(user, skillId, 'read'));
    }
    async newName(user, query) {
        const target = await this.targetForCreate(user, query);
        return { name: await this.skillService.freeName(query.name, target) };
    }
    async create(user, payload, source = 'ui') {
        const target = await this.targetForCreate(user, payload);
        const id = await this.skillService.create({
            checkNameTaken: true,
            target,
            skill: payload.skill,
            source: 'ui',
            createdById: user.id,
        });
        await this.skillsTelemetry.created(user.id, [{ id, ...target }], source, source === 'ui' ? (payload.method ?? 'manual') : 'ai');
        const [skill] = await this.skillRepository.findByIds([id]);
        if (!skill)
            throw new errors_1.NotFoundError('Skill not found');
        return await this.toDetail(user, skill);
    }
    async update(user, skillId, payload, source = 'ui') {
        const skill = await this.requireAccess(user, skillId, 'update');
        const { scope, projectId, ...update } = payload;
        const target = scope ? await this.targetForCreate(user, { scope, projectId }) : undefined;
        const moves = target !== undefined &&
            (target.projectId !== skill.projectId || target.agentId !== skill.agentId);
        const checkedSource = moves ? await this.skillService.assertCanMove(user, skillId) : undefined;
        if (!moves) {
            const { followingAgentIds: _following, ...saved } = await this.skillService.save(skillId, update, user.id);
            if (saved.created) {
                await this.skillsTelemetry.updated(user.id, skill, source, saved.version, false);
            }
            return { id: skillId, ...saved, skillHash: (0, agent_config_hash_1.getAgentSkillHash)(saved.skill) };
        }
        const { followingAgentIds, ...saved } = await this.txRunner.run({}, async (ctx) => {
            await this.skillService.changeTarget(skillId, target, undefined, ctx, {
                nameAfterMove: update.name,
                checkedSource,
            });
            return await this.skillService.save(skillId, update, user.id, ctx);
        });
        await this.skillService.refreshFollowingAgents(followingAgentIds);
        if (saved.created) {
            await this.skillsTelemetry.updated(user.id, { id: skillId, ...target }, source, saved.version, true);
        }
        return { id: skillId, ...saved, skillHash: (0, agent_config_hash_1.getAgentSkillHash)(saved.skill) };
    }
    async delete(user, skillId, source = 'ui') {
        const skill = await this.requireAccess(user, skillId, 'delete');
        const agentProjectIds = await this.projectScopeService.getProjectIds(user, ['agent:read']);
        await this.skillService.deleteSkill(skillId, agentProjectIds ?? 'all');
        await this.skillsTelemetry.deleted(user.id, skill, source);
    }
    async toDetail(user, skill) {
        const [item] = await this.toListItems(user, [skill]);
        const latest = (await this.skillRepository.findLatestSaved([skill.id])).get(skill.id);
        if (!item || !latest)
            throw new errors_1.NotFoundError('Skill not found');
        const content = (0, skill_service_1.toAgentSkill)(latest);
        const agentProjectIds = await this.projectScopeService.getProjectIds(user, ['agent:read']);
        return {
            ...item,
            name: latest.version.name,
            description: latest.version.description,
            latestVersion: latest.version.version,
            skill: content,
            skillHash: (0, agent_config_hash_1.getAgentSkillHash)(content),
            usedBy: await this.skillRepository.findUsage(skill.id, agentProjectIds ?? 'all'),
        };
    }
    async requireAccess(user, skillId, operation) {
        const [skill] = await this.skillRepository.findByIds([skillId]);
        if (!skill || !(await this.skillService.canAccess(user, skill, 'read'))) {
            throw new errors_1.NotFoundError('Skill not found');
        }
        if (operation !== 'read' && !(await this.skillService.canAccess(user, skill, operation))) {
            throw new errors_1.ForbiddenError(operation === 'delete'
                ? 'You are not allowed to delete this skill.'
                : 'You can use but not edit this skill.');
        }
        return skill;
    }
    async attachTarget(agentId) {
        if (agentId === undefined)
            return undefined;
        const agent = (await this.skillRepository.findAgents([agentId])).get(agentId);
        if (!agent)
            throw new errors_1.NotFoundError('Agent not found');
        return { agentId, projectId: agent.projectId };
    }
    async targetForCreate(user, payload) {
        switch (payload.scope) {
            case 'instance':
                if (payload.projectId || payload.agentId) {
                    throw new errors_1.UserError('An instance skill has no project and no agent.');
                }
                if (!(0, permissions_1.hasGlobalScope)(user, 'skill:create')) {
                    throw new errors_1.ForbiddenError('You are not allowed to create skills for the whole instance.');
                }
                return { projectId: null, agentId: null };
            case 'project': {
                const { projectId } = payload;
                if (!projectId)
                    throw new errors_1.UserError('A project skill needs a project id.');
                if (payload.agentId)
                    throw new errors_1.UserError('A project skill has no agent.');
                await this.assertCanCreateIn(user, projectId);
                if (!(await this.skillRepository.findProjects([projectId])).has(projectId)) {
                    throw new errors_1.NotFoundError('Project not found');
                }
                return { projectId, agentId: null };
            }
            case 'agent': {
                const { agentId } = payload;
                if (!agentId)
                    throw new errors_1.UserError('An agent skill needs an agent id.');
                if (payload.projectId)
                    throw new errors_1.UserError('An agent skill takes its project from the agent.');
                const agent = (await this.skillRepository.findAgents([agentId])).get(agentId);
                if (!agent)
                    throw new errors_1.NotFoundError('Agent not found');
                await this.assertCanCreateIn(user, agent.projectId);
                return { projectId: null, agentId };
            }
        }
    }
    async assertCanCreateIn(user, projectId) {
        if (!(await (0, check_access_1.userHasScopes)(user, ['projectSkill:create'], false, { projectId }))) {
            throw new errors_1.ForbiddenError('You are not allowed to create skills for this project.');
        }
    }
    async toListItems(user, skills) {
        const ids = skills.map((skill) => skill.id);
        const agents = await this.skillRepository.findAgents(skills.flatMap((skill) => (skill.agentId ? [skill.agentId] : [])));
        const projectOf = (skill) => skill.projectId ?? (skill.agentId ? (agents.get(skill.agentId)?.projectId ?? null) : null);
        const [latest, usage, projects, creators, canEdit, canDelete] = await Promise.all([
            this.skillRepository.findLatestSummaries(ids),
            this.skillRepository.countUsingAgents(ids),
            this.skillRepository.findProjects(skills.flatMap((skill) => projectOf(skill) ?? [])),
            this.findCreators(skills),
            this.skillService.accessCheck(user, 'update'),
            this.skillService.accessCheck(user, 'delete'),
        ]);
        const items = [];
        for (const skill of skills) {
            const summary = latest.get(skill.id);
            if (!summary)
                continue;
            const projectId = projectOf(skill);
            items.push({
                id: skill.id,
                name: summary.name,
                description: summary.description,
                scope: scopeOf(skill),
                projectId,
                projectName: projectId ? (projects.get(projectId)?.name ?? null) : null,
                projectType: projectId ? (projects.get(projectId)?.type ?? null) : null,
                agentId: skill.agentId,
                agentName: skill.agentId ? (agents.get(skill.agentId)?.name ?? null) : null,
                source: skill.source,
                createdBy: skill.createdById ? (creators.get(skill.createdById) ?? null) : null,
                latestVersion: summary.version,
                usedByAgents: usage.get(skill.id) ?? 0,
                canEdit: canEdit(skill, projectId),
                canDelete: canDelete(skill, projectId),
                createdAt: skill.createdAt.toISOString(),
                updatedAt: skill.updatedAt.toISOString(),
            });
        }
        return items;
    }
    async findCreators(skills) {
        const ids = [...new Set(skills.flatMap((skill) => skill.createdById ?? []))];
        if (ids.length === 0)
            return new Map();
        const users = await this.userRepository.findManyByIds(ids);
        return new Map(users.map((creator) => [
            creator.id,
            {
                id: creator.id,
                email: creator.email ?? null,
                firstName: creator.firstName ?? null,
                lastName: creator.lastName ?? null,
            },
        ]));
    }
};
exports.SkillsApiService = SkillsApiService;
exports.SkillsApiService = SkillsApiService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [skill_service_1.SkillService, skill_repository_1.SkillRepository, backend_services_1.ProjectScopeService, db_1.TransactionRunner, db_1.UserRepository, skills_telemetry_1.SkillsTelemetry])
], SkillsApiService);
//# sourceMappingURL=skills-api.service.js.map