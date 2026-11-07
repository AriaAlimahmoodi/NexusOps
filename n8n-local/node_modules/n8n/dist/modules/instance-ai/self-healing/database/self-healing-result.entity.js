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
exports.SelfHealingResult = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
const workflow_suggestion_entity_1 = require("../../workflow-suggestions/database/workflow-suggestion.entity");
let SelfHealingResult = class SelfHealingResult extends db_1.WithTimestampsAndStringId {
};
exports.SelfHealingResult = SelfHealingResult;
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], SelfHealingResult.prototype, "workflowId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => db_1.WorkflowEntity, { nullable: false, onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'workflowId' }),
    __metadata("design:type", Object)
], SelfHealingResult.prototype, "workflow", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], SelfHealingResult.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => db_1.Project, { nullable: false, onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'projectId' }),
    __metadata("design:type", Object)
], SelfHealingResult.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], SelfHealingResult.prototype, "backgroundUserId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => db_1.User, { nullable: false, onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'backgroundUserId' }),
    __metadata("design:type", Object)
], SelfHealingResult.prototype, "backgroundUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16 }),
    __metadata("design:type", String)
], SelfHealingResult.prototype, "outcome", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], SelfHealingResult.prototype, "summary", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], SelfHealingResult.prototype, "report", void 0);
__decorate([
    (0, db_1.DateTimeColumn)(),
    __metadata("design:type", Date)
], SelfHealingResult.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], SelfHealingResult.prototype, "executionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], SelfHealingResult.prototype, "suggestionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => workflow_suggestion_entity_1.WorkflowSuggestion, { nullable: true, onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'suggestionId' }),
    __metadata("design:type", Object)
], SelfHealingResult.prototype, "suggestion", void 0);
__decorate([
    (0, db_1.JsonColumn)(),
    __metadata("design:type", Object)
], SelfHealingResult.prototype, "usage", void 0);
__decorate([
    (0, db_1.DateTimeColumn)({ nullable: true }),
    __metadata("design:type", Object)
], SelfHealingResult.prototype, "dismissedAt", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], SelfHealingResult.prototype, "dismissedById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => db_1.User, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'dismissedById' }),
    __metadata("design:type", Object)
], SelfHealingResult.prototype, "dismissedBy", void 0);
exports.SelfHealingResult = SelfHealingResult = __decorate([
    (0, typeorm_1.Entity)('self_healing_result'),
    (0, typeorm_1.Index)(['suggestionId'], { unique: true, where: '"suggestionId" IS NOT NULL' })
], SelfHealingResult);
//# sourceMappingURL=self-healing-result.entity.js.map