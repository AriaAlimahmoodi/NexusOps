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
exports.AgentThreadGrantRepository = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const agent_thread_grant_entity_1 = require("../entities/agent-thread-grant.entity");
let AgentThreadGrantRepository = class AgentThreadGrantRepository extends db_1.BaseRepository {
    constructor(dataSource, transactionRunner) {
        super(agent_thread_grant_entity_1.AgentThreadGrant, dataSource.manager, transactionRunner);
    }
    async grant(threadId, grantKey) {
        await this.createQueryBuilder().insert().values({ threadId, grantKey }).orIgnore().execute();
    }
    async revoke(threadId, grantKey) {
        await this.delete({ threadId, grantKey });
    }
    async findKeys(threadId) {
        const grants = await this.find({ where: { threadId }, select: ['grantKey'] });
        return new Set(grants.map(({ grantKey }) => grantKey));
    }
};
exports.AgentThreadGrantRepository = AgentThreadGrantRepository;
exports.AgentThreadGrantRepository = AgentThreadGrantRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, db_1.TransactionRunner])
], AgentThreadGrantRepository);
//# sourceMappingURL=agent-thread-grant.repository.js.map