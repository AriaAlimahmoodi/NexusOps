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
exports.TagService = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const external_hooks_1 = require("../external-hooks");
const generic_helpers_1 = require("../generic-helpers");
let TagService = class TagService {
    constructor(externalHooks, tagRepository, txRunner) {
        this.externalHooks = externalHooks;
        this.tagRepository = tagRepository;
        this.txRunner = txRunner;
    }
    toEntity(attrs) {
        attrs.name = attrs.name.trim();
        return this.tagRepository.create(attrs);
    }
    async save(tag, actionKind) {
        await (0, generic_helpers_1.validateEntity)(tag);
        const action = (actionKind[0].toUpperCase() + actionKind.slice(1));
        await this.externalHooks.run(`tag.before${action}`, [tag]);
        const savedTag = this.tagRepository.save(tag, { transaction: false });
        await this.externalHooks.run(`tag.after${action}`, [tag]);
        return await savedTag;
    }
    async reconcileTagId(oldId, newId) {
        await this.txRunner.run({}, async (ctx) => await this.tagRepository.reconcileTagId(oldId, newId, ctx));
    }
    async delete(id) {
        await this.externalHooks.run('tag.beforeDelete', [id]);
        const deleteResult = this.tagRepository.delete(id);
        await this.externalHooks.run('tag.afterDelete', [id]);
        return await deleteResult;
    }
    async getAll(options) {
        if (options?.withUsageCount) {
            const tags = await this.tagRepository.findAllWithUsageCount({
                orderByName: options.orderByName,
                limit: options.limit,
            });
            return tags;
        }
        return await this.tagRepository.find({
            select: ['id', 'name', 'createdAt', 'updatedAt'],
            ...(options?.orderByName ? { order: { name: 'ASC' } } : {}),
            ...(options?.limit !== undefined ? { take: options.limit } : {}),
        });
    }
    async getPaginated({ offset, limit }) {
        const [data, count] = await this.tagRepository.findAndCount({
            skip: offset,
            take: limit,
            select: ['id', 'name', 'createdAt', 'updatedAt'],
            order: { createdAt: 'ASC', id: 'ASC' },
        });
        return { data, count };
    }
    async getById(id) {
        return await this.tagRepository.findOneOrFail({
            where: { id },
        });
    }
    async getByIds(ids) {
        if (ids.length === 0)
            return [];
        return await this.tagRepository.findMany(ids);
    }
    async getByNames(names) {
        if (names.length === 0)
            return [];
        return await this.tagRepository.findManyByName(names);
    }
    async getAllByWorkflowId(workflowId) {
        return await this.tagRepository.findBy({ workflows: { id: workflowId } });
    }
    async listWithUsageCount({ limit }) {
        const [data, totalCount] = await Promise.all([
            this.getAll({ withUsageCount: true, limit, orderByName: true }),
            this.tagRepository.count(),
        ]);
        return { data, totalCount };
    }
    sortByRequestOrder(tags, { requestOrder }) {
        const tagMap = tags.reduce((acc, tag) => {
            acc[tag.id] = tag;
            return acc;
        }, {});
        return requestOrder.map((tagId) => tagMap[tagId]);
    }
    async findOrCreateByNames(names) {
        const uniqueNames = [
            ...new Set(names.map((name) => name.trim()).filter((name) => name.length > 0)),
        ];
        if (uniqueNames.length === 0)
            return [];
        const existing = await this.tagRepository.findManyByName(uniqueNames);
        const existingByName = new Map(existing.map((t) => [t.name, t]));
        const result = [];
        for (const name of uniqueNames) {
            const hit = existingByName.get(name);
            if (hit) {
                result.push(hit);
                continue;
            }
            try {
                const created = await this.save(this.toEntity({ name }), 'create');
                result.push(created);
            }
            catch (error) {
                if (!(0, db_1.isUniqueConstraintError)(error))
                    throw error;
                const raced = await this.tagRepository.findOneBy({ name });
                if (!raced)
                    throw error;
                result.push(raced);
            }
        }
        return result;
    }
};
exports.TagService = TagService;
exports.TagService = TagService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [external_hooks_1.ExternalHooks, db_1.TagRepository, db_1.TransactionRunner])
], TagService);
//# sourceMappingURL=tag.service.js.map