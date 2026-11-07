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
exports.ChatHubToolRepository = void 0;
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const chat_hub_agent_entity_1 = require("./chat-hub-agent.entity");
const chat_hub_session_entity_1 = require("./chat-hub-session.entity");
const chat_hub_tool_entity_1 = require("./chat-hub-tool.entity");
let ChatHubToolRepository = class ChatHubToolRepository extends typeorm_1.Repository {
    constructor(dataSource) {
        super(chat_hub_tool_entity_1.ChatHubTool, dataSource.manager);
    }
    async createTool(tool, trx) {
        const em = trx ?? this.manager;
        await em.insert(chat_hub_tool_entity_1.ChatHubTool, tool);
        return await em.findOneOrFail(chat_hub_tool_entity_1.ChatHubTool, {
            where: { id: tool.id },
        });
    }
    async updateTool(id, updates, trx) {
        const em = trx ?? this.manager;
        await em.update(chat_hub_tool_entity_1.ChatHubTool, { id }, updates);
        return await em.findOneOrFail(chat_hub_tool_entity_1.ChatHubTool, {
            where: { id },
        });
    }
    async deleteTool(id, trx) {
        const em = trx ?? this.manager;
        return await em.delete(chat_hub_tool_entity_1.ChatHubTool, { id });
    }
    async getManyByUserId(userId) {
        return await this.find({
            where: { ownerId: userId },
            order: { createdAt: 'ASC' },
        });
    }
    async getEnabledByUserId(userId, trx) {
        const em = trx ?? this.manager;
        return await em.find(chat_hub_tool_entity_1.ChatHubTool, {
            where: { ownerId: userId, enabled: true },
            order: { createdAt: 'ASC' },
        });
    }
    async getOneById(id, userId, trx) {
        const em = trx ?? this.manager;
        return await em.findOne(chat_hub_tool_entity_1.ChatHubTool, {
            where: { id, ownerId: userId },
        });
    }
    async getByIds(ids, userId, trx) {
        const em = trx ?? this.manager;
        if (ids.length === 0)
            return [];
        return await em
            .createQueryBuilder(chat_hub_tool_entity_1.ChatHubTool, 'tool')
            .where('tool.id IN (:...ids)', { ids })
            .andWhere('tool.ownerId = :userId', { userId })
            .orderBy('tool.createdAt', 'ASC')
            .getMany();
    }
    async getToolsForSession(sessionId, trx) {
        const em = trx ?? this.manager;
        const session = await em
            .createQueryBuilder(chat_hub_session_entity_1.ChatHubSession, 'session')
            .innerJoinAndSelect('session.tools', 'tool', 'tool.ownerId = session.ownerId')
            .where('session.id = :sessionId', { sessionId })
            .orderBy('tool.createdAt', 'ASC')
            .getOne();
        return session?.tools ?? [];
    }
    async getToolsForAgent(agentId, trx) {
        const em = trx ?? this.manager;
        const agent = await em
            .createQueryBuilder(chat_hub_agent_entity_1.ChatHubAgent, 'agent')
            .innerJoinAndSelect('agent.tools', 'tool', 'tool.ownerId = agent.ownerId')
            .where('agent.id = :agentId', { agentId })
            .orderBy('tool.createdAt', 'ASC')
            .getOne();
        return agent?.tools ?? [];
    }
    async getToolIdsForSession(sessionId, trx) {
        const em = trx ?? this.manager;
        const rows = await em
            .createQueryBuilder(chat_hub_session_entity_1.ChatHubSession, 'session')
            .innerJoin('session.tools', 'tool', 'tool.ownerId = session.ownerId')
            .select('tool.id', 'toolId')
            .where('session.id = :sessionId', { sessionId })
            .getRawMany();
        return rows.map((r) => r.toolId);
    }
    async getToolIdsForAgent(agentId, trx) {
        const em = trx ?? this.manager;
        const rows = await em
            .createQueryBuilder(chat_hub_agent_entity_1.ChatHubAgent, 'agent')
            .innerJoin('agent.tools', 'tool', 'tool.ownerId = agent.ownerId')
            .select('tool.id', 'toolId')
            .where('agent.id = :agentId', { agentId })
            .getRawMany();
        return rows.map((r) => r.toolId);
    }
    async setSessionTools(sessionId, toolIds, trx) {
        await this.replaceLinkedTools(chat_hub_session_entity_1.ChatHubSession, sessionId, toolIds, trx ?? this.manager);
    }
    async setAgentTools(agentId, toolIds, trx) {
        await this.replaceLinkedTools(chat_hub_agent_entity_1.ChatHubAgent, agentId, toolIds, trx ?? this.manager);
    }
    async replaceLinkedTools(entity, id, toolIds, em) {
        const relation = em.createQueryBuilder().relation(entity, 'tools').of(id);
        const currentTools = await relation.loadMany();
        await relation.addAndRemove(toolIds, currentTools.map((t) => t.id));
    }
};
exports.ChatHubToolRepository = ChatHubToolRepository;
exports.ChatHubToolRepository = ChatHubToolRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], ChatHubToolRepository);
//# sourceMappingURL=chat-hub-tool.repository.js.map