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
exports.AgentPlanService = void 0;
const di_1 = require("@n8n/di");
const agent_plan_schema_1 = require("./plans/agent-plan.schema");
const agent_plan_validation_1 = require("./plans/agent-plan.validation");
const agent_plan_repository_1 = require("./repositories/agent-plan.repository");
let AgentPlanService = class AgentPlanService {
    constructor(repository) {
        this.repository = repository;
    }
    async createActivePlan(input, ctx) {
        const data = (0, agent_plan_validation_1.prepareAgentPlan)(input.data, input.formatVersion, null, new Date());
        return this.decode(await this.repository.createActivePlan({ ...input, data }, ctx));
    }
    async findActivePlan(threadId, ctx) {
        const plan = await this.repository.findActivePlan(threadId, ctx);
        return plan ? this.decode(plan) : null;
    }
    async findPlan(threadId, planId, ctx) {
        const plan = await this.repository.findPlan(threadId, planId, ctx);
        return plan ? this.decode(plan) : null;
    }
    async findRevision(threadId, planId, revision, ctx) {
        const plan = await this.repository.findRevision(threadId, planId, revision, ctx);
        return plan ? this.decode(plan) : null;
    }
    async listHistory(threadId, planId, options, ctx) {
        return await this.repository.listHistory(threadId, planId, options, ctx);
    }
    async replacePlan(input, ctx) {
        const current = await this.loadForWrite(input, ctx);
        const data = (0, agent_plan_validation_1.prepareAgentPlan)(input.data, input.formatVersion, current.data, new Date());
        return this.decode(await this.repository.replacePlan({ ...input, data }, ctx));
    }
    async closePlan(input, ctx) {
        await this.loadForWrite(input, ctx);
        return this.decode(await this.repository.closePlan(input, ctx));
    }
    async loadForWrite(input, ctx) {
        const current = await this.repository.findPlan(input.threadId, input.planId, ctx);
        if (!current || current.closedAt !== null || current.revision !== input.expectedRevision) {
            throw new agent_plan_repository_1.AgentPlanWriteConflictError();
        }
        return this.decode(current);
    }
    decode(record) {
        const data = (0, agent_plan_schema_1.parseAgentPlan)(record.data, record.formatVersion);
        const readiness = (0, agent_plan_validation_1.getAgentPlanReadiness)(data);
        return { ...record, data, readiness: record.closedAt ? { ready: [], blocked: [] } : readiness };
    }
};
exports.AgentPlanService = AgentPlanService;
exports.AgentPlanService = AgentPlanService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [agent_plan_repository_1.AgentPlanRepository])
], AgentPlanService);
//# sourceMappingURL=agent-plan.service.js.map