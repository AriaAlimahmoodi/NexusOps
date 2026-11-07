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
exports.AgentPlanHistory = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
let AgentPlanHistory = class AgentPlanHistory extends db_1.WithCreatedAt {
};
exports.AgentPlanHistory = AgentPlanHistory;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'uuid', comment: 'Plan that owns this snapshot' }),
    __metadata("design:type", String)
], AgentPlanHistory.prototype, "planId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('AgentPlan', { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'planId' }),
    __metadata("design:type", Object)
], AgentPlanHistory.prototype, "plan", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'int', comment: 'Document revision captured by this snapshot' }),
    __metadata("design:type", Number)
], AgentPlanHistory.prototype, "revision", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', comment: 'Version of the snapshot JSON format' }),
    __metadata("design:type", Number)
], AgentPlanHistory.prototype, "formatVersion", void 0);
__decorate([
    (0, db_1.JsonColumn)({ comment: 'Complete plan document after this change' }),
    __metadata("design:type", Object)
], AgentPlanHistory.prototype, "data", void 0);
__decorate([
    (0, db_1.DateTimeColumn)({ precision: 3, nullable: true, comment: 'Plan closure time at this revision' }),
    __metadata("design:type", Object)
], AgentPlanHistory.prototype, "closedAt", void 0);
exports.AgentPlanHistory = AgentPlanHistory = __decorate([
    (0, typeorm_1.Entity)({ name: 'agent_plan_history' }),
    (0, typeorm_1.Check)('"revision" > 0'),
    (0, typeorm_1.Check)('"formatVersion" > 0')
], AgentPlanHistory);
//# sourceMappingURL=agent-plan-history.entity.js.map