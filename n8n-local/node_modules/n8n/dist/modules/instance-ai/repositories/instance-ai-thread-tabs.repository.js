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
exports.InstanceAiThreadTabsRepository = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const instance_ai_thread_tabs_entity_1 = require("../entities/instance-ai-thread-tabs.entity");
let InstanceAiThreadTabsRepository = class InstanceAiThreadTabsRepository extends db_1.BaseRepository {
    constructor(dataSource, transactionRunner) {
        super(instance_ai_thread_tabs_entity_1.InstanceAiThreadTabs, dataSource.manager, transactionRunner);
    }
    async findState(threadId, userId) {
        const row = await this.findOne({ where: { threadId, userId }, select: ['state'] });
        return row?.state ?? null;
    }
    async saveState(threadId, userId, state) {
        await this.upsert({ threadId, userId, state, updatedAt: new Date() }, ['threadId', 'userId']);
    }
    async updateState(threadId, userId, update) {
        await this.runInTransaction({}, async (manager) => {
            const repository = manager.getRepository(instance_ai_thread_tabs_entity_1.InstanceAiThreadTabs);
            const row = await repository.findOne({
                where: { threadId, userId },
                select: ['state'],
                lock: manager.connection.options.type === 'postgres'
                    ? { mode: 'pessimistic_write' }
                    : undefined,
            });
            const state = update(row?.state ?? null);
            if (state === null)
                return;
            await repository.upsert({ threadId, userId, state, updatedAt: new Date() }, [
                'threadId',
                'userId',
            ]);
        });
    }
};
exports.InstanceAiThreadTabsRepository = InstanceAiThreadTabsRepository;
exports.InstanceAiThreadTabsRepository = InstanceAiThreadTabsRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, db_1.TransactionRunner])
], InstanceAiThreadTabsRepository);
//# sourceMappingURL=instance-ai-thread-tabs.repository.js.map