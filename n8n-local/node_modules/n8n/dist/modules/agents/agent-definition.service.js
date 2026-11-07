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
exports.AgentDefinitionService = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
const n8n_workflow_1 = require("n8n-workflow");
const agent_skill_refs_service_1 = require("./agent-skill-refs.service");
const agent_document_1 = require("./json-config/agent-document");
const agent_task_snapshot_repository_1 = require("./repositories/agent-task-snapshot.repository");
const agent_task_repository_1 = require("./repositories/agent-task.repository");
const agent_repository_1 = require("./repositories/agent.repository");
const agent_definition_1 = require("./utils/agent-definition");
const agent_draft_utils_1 = require("./utils/agent-draft.utils");
let AgentDefinitionService = class AgentDefinitionService {
    constructor(taskRepository, taskSnapshotRepository, agentRepository, transactionRunner, agentSkillRefs) {
        this.taskRepository = taskRepository;
        this.taskSnapshotRepository = taskSnapshotRepository;
        this.agentRepository = agentRepository;
        this.transactionRunner = transactionRunner;
        this.agentSkillRefs = agentSkillRefs;
    }
    async readDraft(agent, ctx = {}, pending) {
        const tasks = await this.taskRepository.findByAgentId(agent.id);
        if (!(await this.agentRepository.hasRevision(agent.id, agent.revision))) {
            throw new errors_1.ConflictError('Agent was modified concurrently; please retry');
        }
        const skillRefs = pending
            ? pending.skillRefs
            : await this.agentSkillRefs.refsForDraft(agent, ctx);
        const skills = await this.agentSkillRefs.skillsForRefs(agent, skillRefs, ctx);
        return {
            ...(0, agent_definition_1.getAgentDefinitionContent)(agent, skillRefs, skills),
            tasks: new Map(tasks.map((task) => [task.id, (0, agent_definition_1.getAgentTaskBody)(task)])),
        };
    }
    async readVersion(version, ctx = {}) {
        const tasks = await this.taskSnapshotRepository.findByVersionId(version.versionId, ctx);
        const { skillRefs, skills } = await this.agentSkillRefs.readVersion(version, ctx);
        return {
            ...(0, agent_definition_1.getAgentDefinitionContent)(version, skillRefs, skills),
            tasks: new Map(tasks.map((task) => [task.taskId, (0, agent_definition_1.getAgentTaskBody)(task)])),
        };
    }
    async replaceDraft(agent, definition, ctx = {}, skillPinsFrom) {
        const document = structuredClone(definition.schema);
        const { config, skillRefs } = document
            ? (0, agent_document_1.fromAgentDocument)(document)
            : { config: null, skillRefs: undefined };
        return await this.transactionRunner.run(ctx, async (txCtx) => {
            agent.schema = config;
            agent.tools = (0, n8n_workflow_1.deepCopy)(definition.tools);
            if (agent.schema)
                agent.name = agent.schema.name;
            await (0, agent_draft_utils_1.saveAgentDraftFenced)(this.agentRepository, agent, txCtx);
            if (skillPinsFrom) {
                await this.agentSkillRefs.restoreDraftRefs(agent, skillPinsFrom, skillRefs, txCtx);
            }
            else {
                await this.agentSkillRefs.replaceDraftRefs(agent, skillRefs, txCtx);
            }
            return await this.taskRepository.replaceForAgent(agent.id, definition.tasks, txCtx);
        });
    }
};
exports.AgentDefinitionService = AgentDefinitionService;
exports.AgentDefinitionService = AgentDefinitionService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [agent_task_repository_1.AgentTaskRepository, agent_task_snapshot_repository_1.AgentTaskSnapshotRepository, agent_repository_1.AgentRepository, db_1.TransactionRunner, agent_skill_refs_service_1.AgentSkillRefsService])
], AgentDefinitionService);
//# sourceMappingURL=agent-definition.service.js.map