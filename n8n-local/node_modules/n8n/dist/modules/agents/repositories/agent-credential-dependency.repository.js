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
exports.AgentCredentialDependencyRepository = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const agent_credential_dependency_entity_1 = require("../entities/agent-credential-dependency.entity");
const agent_history_entity_1 = require("../entities/agent-history.entity");
const agent_entity_1 = require("../entities/agent.entity");
const extract_agent_credential_ids_1 = require("../utils/extract-agent-credential-ids");
let AgentCredentialDependencyRepository = class AgentCredentialDependencyRepository extends db_1.BaseRepository {
    constructor(dataSource, txRunner) {
        super(agent_credential_dependency_entity_1.AgentCredentialDependency, dataSource.manager, txRunner);
        this.txRunner = txRunner;
    }
    async refreshForAgent(agentId) {
        await this.txRunner.run({}, async (ctx) => {
            const manager = this.managerFor(ctx);
            const isPostgres = manager.connection.options.type === 'postgres';
            if (!isPostgres) {
                await manager.delete(agent_credential_dependency_entity_1.AgentCredentialDependency, { agentId });
            }
            const agent = isPostgres
                ? await manager.findOne(agent_entity_1.Agent, {
                    where: { id: agentId },
                    lock: { mode: 'pessimistic_write' },
                })
                : await manager.findOne(agent_entity_1.Agent, { where: { id: agentId } });
            if (agent === null) {
                if (isPostgres)
                    await manager.delete(agent_credential_dependency_entity_1.AgentCredentialDependency, { agentId });
                return;
            }
            const publishedVersion = agent.activeVersionId === null
                ? null
                : await manager.findOne(agent_history_entity_1.AgentHistory, {
                    where: { versionId: agent.activeVersionId, agentId },
                });
            const draftCredentialIds = (0, extract_agent_credential_ids_1.extractAgentCredentialIds)({
                ...agent.schema,
                integrations: agent.integrations,
            });
            const publishedCredentialIds = (0, extract_agent_credential_ids_1.extractAgentCredentialIds)(publishedVersion?.schema);
            const referencedCredentialIds = new Set([...draftCredentialIds, ...publishedCredentialIds]);
            const existingCredentialIds = await this.findExistingCredentialIds(manager, referencedCredentialIds, isPostgres);
            if (isPostgres) {
                await manager.delete(agent_credential_dependency_entity_1.AgentCredentialDependency, { agentId });
            }
            const rows = [...referencedCredentialIds]
                .filter((credentialId) => existingCredentialIds.has(credentialId))
                .map((credentialId) => ({ agentId, credentialId }));
            if (rows.length > 0) {
                await manager.insert(agent_credential_dependency_entity_1.AgentCredentialDependency, rows);
            }
        });
    }
    async removeForAgent(agentId) {
        await this.managerFor({}).delete(agent_credential_dependency_entity_1.AgentCredentialDependency, { agentId });
    }
    async findByCredentialIds(credentialIds) {
        if (credentialIds.length === 0)
            return [];
        return await this.find({
            select: ['agentId', 'credentialId'],
            where: { credentialId: (0, typeorm_1.In)(credentialIds) },
        });
    }
    async findExistingCredentialIds(manager, credentialIds, lockForUpdate) {
        if (credentialIds.size === 0)
            return new Set();
        const query = manager
            .createQueryBuilder(db_1.CredentialsEntity, 'credential')
            .select(['credential.id'])
            .where('credential.id IN (:...credentialIds)', { credentialIds: [...credentialIds] });
        query.orderBy('credential.id', 'ASC');
        if (lockForUpdate)
            query.setLock('pessimistic_write');
        return new Set((await query.getMany()).map(({ id }) => id));
    }
};
exports.AgentCredentialDependencyRepository = AgentCredentialDependencyRepository;
exports.AgentCredentialDependencyRepository = AgentCredentialDependencyRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, db_1.TransactionRunner])
], AgentCredentialDependencyRepository);
//# sourceMappingURL=agent-credential-dependency.repository.js.map