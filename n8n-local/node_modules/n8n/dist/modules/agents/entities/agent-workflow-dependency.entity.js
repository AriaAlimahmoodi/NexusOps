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
exports.AgentWorkflowDependency = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
let AgentWorkflowDependency = class AgentWorkflowDependency extends db_1.WithCreatedAt {
};
exports.AgentWorkflowDependency = AgentWorkflowDependency;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], AgentWorkflowDependency.prototype, "agentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('Agent', { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'agentId' }),
    __metadata("design:type", Object)
], AgentWorkflowDependency.prototype, "agent", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], AgentWorkflowDependency.prototype, "workflowId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('WorkflowEntity', { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'workflowId' }),
    __metadata("design:type", Object)
], AgentWorkflowDependency.prototype, "workflow", void 0);
exports.AgentWorkflowDependency = AgentWorkflowDependency = __decorate([
    (0, typeorm_1.Entity)({ name: 'agent_workflow_dependency' })
], AgentWorkflowDependency);
//# sourceMappingURL=agent-workflow-dependency.entity.js.map