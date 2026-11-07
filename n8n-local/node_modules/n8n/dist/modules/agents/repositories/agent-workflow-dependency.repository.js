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
exports.AgentWorkflowDependencyRepository = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const agent_history_entity_1 = require("../entities/agent-history.entity");
const agent_workflow_dependency_entity_1 = require("../entities/agent-workflow-dependency.entity");
const agent_entity_1 = require("../entities/agent.entity");
const extract_agent_workflow_refs_1 = require("../utils/extract-agent-workflow-refs");
let AgentWorkflowDependencyRepository = class AgentWorkflowDependencyRepository extends db_1.BaseRepository {
    constructor(dataSource, txRunner) {
        super(agent_workflow_dependency_entity_1.AgentWorkflowDependency, dataSource.manager, txRunner);
        this.txRunner = txRunner;
    }
    async refreshForAgent(agentId) {
        await this.txRunner.run({}, async (ctx) => {
            const manager = this.managerFor(ctx);
            const isPostgres = manager.connection.options.type === 'postgres';
            if (!isPostgres) {
                await manager.delete(agent_workflow_dependency_entity_1.AgentWorkflowDependency, { agentId });
            }
            const agent = isPostgres
                ? await manager.findOne(agent_entity_1.Agent, {
                    where: { id: agentId },
                    lock: { mode: 'pessimistic_write' },
                })
                : await manager.findOne(agent_entity_1.Agent, { where: { id: agentId } });
            if (agent === null || !(0, agent_entity_1.isProjectAgent)(agent)) {
                if (isPostgres)
                    await manager.delete(agent_workflow_dependency_entity_1.AgentWorkflowDependency, { agentId });
                return;
            }
            const publishedVersion = agent.activeVersionId === null
                ? null
                : await manager.findOne(agent_history_entity_1.AgentHistory, {
                    where: { versionId: agent.activeVersionId, agentId },
                });
            const refs = [
                ...(0, extract_agent_workflow_refs_1.extractAgentWorkflowRefs)(agent.schema),
                ...(0, extract_agent_workflow_refs_1.extractAgentWorkflowRefs)(publishedVersion?.schema),
            ];
            const workflowIds = [
                ...new Set(refs.flatMap((ref) => (ref.workflowId === undefined ? [] : [ref.workflowId]))),
            ];
            const legacyWorkflowNames = [
                ...new Set(refs.flatMap((ref) => (ref.workflowId === undefined ? [ref.workflow] : []))),
            ];
            const resolvedWorkflowIds = await this.resolveWorkflowIds(manager, agent.projectId, workflowIds, legacyWorkflowNames);
            const existingWorkflowIds = isPostgres
                ? await this.lockWorkflows(manager, resolvedWorkflowIds)
                : resolvedWorkflowIds;
            if (isPostgres) {
                await manager.delete(agent_workflow_dependency_entity_1.AgentWorkflowDependency, { agentId });
            }
            const rows = [...existingWorkflowIds].map((workflowId) => ({ agentId, workflowId }));
            if (rows.length > 0) {
                await manager.insert(agent_workflow_dependency_entity_1.AgentWorkflowDependency, rows);
            }
        });
    }
    async removeForAgent(agentId) {
        await this.managerFor({}).delete(agent_workflow_dependency_entity_1.AgentWorkflowDependency, { agentId });
    }
    async findByWorkflowIds(workflowIds) {
        if (workflowIds.length === 0)
            return [];
        return await this.find({
            select: ['agentId', 'workflowId'],
            where: { workflowId: (0, typeorm_1.In)(workflowIds) },
        });
    }
    async resolveWorkflowIds(manager, projectId, workflowIds, legacyWorkflowNames) {
        const where = (0, db_1.agentToolReferenceWhere)(projectId, workflowIds, legacyWorkflowNames);
        if (where.length === 0)
            return new Set();
        const workflows = await manager.find(db_1.WorkflowEntity, { where, select: ['id'] });
        return new Set(workflows.map(({ id }) => id));
    }
    async lockWorkflows(manager, workflowIds) {
        if (workflowIds.size === 0)
            return new Set();
        const query = manager
            .createQueryBuilder(db_1.WorkflowEntity, 'workflow')
            .select(['workflow.id'])
            .where('workflow.id IN (:...workflowIds)', { workflowIds: [...workflowIds] })
            .orderBy('workflow.id', 'ASC')
            .setLock('pessimistic_write');
        return new Set((await query.getMany()).map(({ id }) => id));
    }
};
exports.AgentWorkflowDependencyRepository = AgentWorkflowDependencyRepository;
exports.AgentWorkflowDependencyRepository = AgentWorkflowDependencyRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, db_1.TransactionRunner])
], AgentWorkflowDependencyRepository);
//# sourceMappingURL=agent-workflow-dependency.repository.js.map