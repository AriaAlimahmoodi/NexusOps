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
exports.AgentScheduledJobOwner = void 0;
const backend_common_1 = require("@n8n/backend-common");
const constants_1 = require("@n8n/constants");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
let AgentScheduledJobOwner = class AgentScheduledJobOwner {
    constructor(moduleRegistry) {
        this.moduleRegistry = moduleRegistry;
        this.ownerType = constants_1.ScheduledJobOwnerType.Agent;
    }
    member(agentId, taskId) {
        return { ownerType: this.ownerType, ownerId: agentId, ownerMemberId: taskId };
    }
    ref(agentId) {
        return { ownerType: this.ownerType, ownerId: agentId };
    }
    async findExisting(ownerIds) {
        if (!this.moduleRegistry.isActive('agents')) {
            throw new n8n_workflow_1.UnexpectedError('Cannot resolve agent liveness: the agents module is not active');
        }
        const { AgentRepository } = await import('../modules/agents/repositories/agent.repository.js');
        return await di_1.Container.get(AgentRepository).findPublishedIds(ownerIds);
    }
};
exports.AgentScheduledJobOwner = AgentScheduledJobOwner;
exports.AgentScheduledJobOwner = AgentScheduledJobOwner = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.ModuleRegistry])
], AgentScheduledJobOwner);
//# sourceMappingURL=agent-scheduled-job-owner.js.map