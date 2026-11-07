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
exports.AgentHistoryRepository = void 0;
exports.renderAuthor = renderAuthor;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const agent_history_entity_1 = require("../entities/agent-history.entity");
function renderAuthor(user) {
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return name || 'Unknown';
}
let AgentHistoryRepository = class AgentHistoryRepository extends db_1.BaseRepository {
    constructor(dataSource, transactionRunner) {
        super(agent_history_entity_1.AgentHistory, dataSource.manager, transactionRunner);
    }
    async saveVersion(data, ctx = {}) {
        const { publishedBy } = data;
        const author = typeof publishedBy === 'string' ? publishedBy : renderAuthor(publishedBy);
        const publishedById = typeof publishedBy === 'string' ? null : publishedBy.id;
        const repo = this.managerFor(ctx).getRepository(agent_history_entity_1.AgentHistory);
        await repo.insert({
            versionId: data.versionId,
            agentId: data.agentId,
            schema: data.schema,
            tools: data.tools,
            skills: (data.skills ?? null),
            author,
            publishedById,
        });
        return await repo.findOneByOrFail({ versionId: data.versionId });
    }
    async findByVersionAndAgentId(versionId, agentId, ctx = {}) {
        const repo = this.managerFor(ctx).getRepository(agent_history_entity_1.AgentHistory);
        return await repo.findOneBy({ versionId, agentId });
    }
    async findByAgentId(agentId, take, skip) {
        return await this.find({
            where: { agentId },
            take,
            skip,
            order: { createdAt: 'DESC' },
            select: {
                versionId: true,
                agentId: true,
                createdAt: true,
                updatedAt: true,
                author: true,
            },
        });
    }
    async existsForAgent(agentId) {
        return await this.existsBy({ agentId });
    }
};
exports.AgentHistoryRepository = AgentHistoryRepository;
exports.AgentHistoryRepository = AgentHistoryRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, db_1.TransactionRunner])
], AgentHistoryRepository);
//# sourceMappingURL=agent-history.repository.js.map