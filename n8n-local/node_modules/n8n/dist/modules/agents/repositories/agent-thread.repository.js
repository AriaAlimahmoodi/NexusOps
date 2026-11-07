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
exports.AgentThreadRepository = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const agent_thread_entity_1 = require("../entities/agent-thread.entity");
let AgentThreadRepository = class AgentThreadRepository extends db_1.BaseRepository {
    constructor(dataSource, transactionRunner) {
        super(agent_thread_entity_1.AgentThreadEntity, dataSource.manager, transactionRunner);
    }
    async patchThread(threadId, update, ctx) {
        return await this.runInTransaction(ctx, async (manager) => {
            const row = await manager.findOne(agent_thread_entity_1.AgentThreadEntity, {
                where: { id: threadId },
                lock: manager.connection.options.type === 'postgres'
                    ? { mode: 'pessimistic_write' }
                    : undefined,
            });
            if (!row)
                return null;
            const patch = update(row);
            if (!patch)
                return row;
            if (patch.title !== undefined)
                row.title = patch.title;
            if (patch.metadata !== undefined)
                row.metadata = patch.metadata;
            return await manager.save(agent_thread_entity_1.AgentThreadEntity, row);
        });
    }
};
exports.AgentThreadRepository = AgentThreadRepository;
exports.AgentThreadRepository = AgentThreadRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, db_1.TransactionRunner])
], AgentThreadRepository);
//# sourceMappingURL=agent-thread.repository.js.map