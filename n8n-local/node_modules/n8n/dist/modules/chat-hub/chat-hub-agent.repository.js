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
exports.ChatHubAgentRepository = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const chat_hub_agent_entity_1 = require("./chat-hub-agent.entity");
let ChatHubAgentRepository = class ChatHubAgentRepository extends db_1.BaseRepository {
    constructor(dataSource, transactionRunner) {
        super(chat_hub_agent_entity_1.ChatHubAgent, dataSource.manager, transactionRunner);
    }
    async createAgent(agent, trx) {
        const em = trx ?? this.manager;
        await em.insert(chat_hub_agent_entity_1.ChatHubAgent, agent);
        return await em.findOneOrFail(chat_hub_agent_entity_1.ChatHubAgent, {
            where: { id: agent.id },
        });
    }
    async updateAgent(id, updates, trx) {
        const em = trx ?? this.manager;
        await em.update(chat_hub_agent_entity_1.ChatHubAgent, { id }, updates);
        return await em.findOneOrFail(chat_hub_agent_entity_1.ChatHubAgent, {
            where: { id },
        });
    }
    async deleteAgent(id, trx) {
        const em = trx ?? this.manager;
        return await em.delete(chat_hub_agent_entity_1.ChatHubAgent, { id });
    }
    async getManyByUserId(userId) {
        return await this.find({
            where: { ownerId: userId },
            order: { createdAt: 'DESC' },
        });
    }
    async getManyByUserIdWithToolIds(userId) {
        return await this.createQueryBuilder('agent')
            .leftJoin('agent.tools', 'tool')
            .addSelect('tool.id')
            .where('agent.ownerId = :userId', { userId })
            .orderBy('agent.createdAt', 'DESC')
            .getMany();
    }
    async getOneById(id, userId, trx) {
        const em = trx ?? this.manager;
        return await em.findOne(chat_hub_agent_entity_1.ChatHubAgent, {
            where: { id, ownerId: userId },
        });
    }
};
exports.ChatHubAgentRepository = ChatHubAgentRepository;
exports.ChatHubAgentRepository = ChatHubAgentRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, db_1.TransactionRunner])
], ChatHubAgentRepository);
//# sourceMappingURL=chat-hub-agent.repository.js.map