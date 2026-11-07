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
exports.InstanceAiThreadRepository = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const instance_ai_thread_entity_1 = require("../entities/instance-ai-thread.entity");
let InstanceAiThreadRepository = class InstanceAiThreadRepository extends db_1.BaseRepository {
    constructor(dataSource, transactionRunner) {
        super(instance_ai_thread_entity_1.InstanceAiThread, dataSource.manager, transactionRunner);
    }
    async updateThread(args) {
        return await this.runInTransaction({}, async (manager) => {
            const repository = manager.getRepository(instance_ai_thread_entity_1.InstanceAiThread);
            const row = await repository.findOne({
                where: { id: args.threadId },
                lock: manager.connection.options.type === 'postgres'
                    ? { mode: 'pessimistic_write' }
                    : undefined,
            });
            if (!row)
                return null;
            const current = {
                id: row.id,
                resourceId: row.resourceId,
                title: row.title || undefined,
                metadata: row.metadata ?? undefined,
                createdAt: row.createdAt,
                updatedAt: row.updatedAt,
            };
            const patch = args.update(current);
            if (!patch)
                return current;
            if (patch.title !== undefined)
                row.title = patch.title;
            if (patch.metadata !== undefined)
                row.metadata = patch.metadata;
            if (patch.resourceId !== undefined)
                row.resourceId = patch.resourceId;
            const saved = await repository.save(row);
            return { ...current, ...patch, title: saved.title || undefined, updatedAt: saved.updatedAt };
        });
    }
    async listHistoryPage(resourceId, limit, search, before) {
        const base = {
            resourceId,
            ...(search
                ? {
                    title: (0, typeorm_1.Raw)((alias) => `LOWER(${alias}) LIKE :search ${db_1.LIKE_ESCAPE_CLAUSE}`, {
                        search: `%${(0, db_1.escapeLike)(search.toLowerCase())}%`,
                    }),
                }
                : {}),
        };
        return await this.find({
            where: before
                ? [
                    { ...base, updatedAt: (0, typeorm_1.LessThan)(before.updatedAt) },
                    { ...base, updatedAt: before.updatedAt, id: (0, typeorm_1.LessThan)(before.id) },
                ]
                : base,
            order: { updatedAt: 'DESC', id: 'DESC' },
            take: limit + 1,
        });
    }
};
exports.InstanceAiThreadRepository = InstanceAiThreadRepository;
exports.InstanceAiThreadRepository = InstanceAiThreadRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, db_1.TransactionRunner])
], InstanceAiThreadRepository);
//# sourceMappingURL=instance-ai-thread.repository.js.map