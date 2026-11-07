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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentTaskRepository = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const isEqual_1 = __importDefault(require("lodash/isEqual"));
const agent_task_entity_1 = require("../entities/agent-task.entity");
const agent_definition_1 = require("../utils/agent-definition");
let AgentTaskRepository = class AgentTaskRepository extends db_1.BaseRepository {
    constructor(dataSource, transactionRunner) {
        super(agent_task_entity_1.AgentTask, dataSource.manager, transactionRunner);
    }
    async findByAgentId(agentId, ctx = {}) {
        return await this.managerFor(ctx).find(agent_task_entity_1.AgentTask, {
            where: { agentId },
            order: { createdAt: 'ASC' },
        });
    }
    async findByIdAndAgentId(id, agentId) {
        return await this.findOne({ where: { id, agentId } });
    }
    async saveDefinitions(tasks, ctx) {
        return await this.managerFor(ctx).save(agent_task_entity_1.AgentTask, tasks);
    }
    async deleteForAgent(agentId, ids, ctx) {
        if (ids.length === 0)
            return;
        await this.managerFor(ctx).delete(agent_task_entity_1.AgentTask, { agentId, id: (0, typeorm_1.In)(ids) });
    }
    async replaceForAgent(agentId, definitions, ctx) {
        const repo = this.managerFor(ctx).getRepository(agent_task_entity_1.AgentTask);
        const existing = await this.findByAgentId(agentId, ctx);
        const existingBodies = new Map(existing.map((task) => [task.id, (0, agent_definition_1.getAgentTaskBody)(task)]));
        const nextBodies = new Map([...definitions].map(([id, task]) => [id, (0, agent_definition_1.getAgentTaskBody)(task)]));
        const changed = !(0, isEqual_1.default)(existingBodies, nextBodies);
        await this.deleteForAgent(agentId, existing.filter((task) => !definitions.has(task.id)).map((task) => task.id), ctx);
        for (const [id, body] of nextBodies) {
            if (existingBodies.has(id)) {
                await repo.update({ id, agentId }, body);
            }
            else {
                await repo.insert({ id, agentId, ...body });
            }
        }
        return changed;
    }
};
exports.AgentTaskRepository = AgentTaskRepository;
exports.AgentTaskRepository = AgentTaskRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, db_1.TransactionRunner])
], AgentTaskRepository);
//# sourceMappingURL=agent-task.repository.js.map