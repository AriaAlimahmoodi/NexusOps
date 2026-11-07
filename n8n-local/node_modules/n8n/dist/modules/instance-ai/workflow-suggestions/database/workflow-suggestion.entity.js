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
exports.WorkflowSuggestion = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
let WorkflowSuggestion = class WorkflowSuggestion extends db_1.WithTimestampsAndStringId {
};
exports.WorkflowSuggestion = WorkflowSuggestion;
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], WorkflowSuggestion.prototype, "workflowId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => db_1.WorkflowEntity, { nullable: false, onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'workflowId' }),
    __metadata("design:type", Object)
], WorkflowSuggestion.prototype, "workflow", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], WorkflowSuggestion.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => db_1.Project, { nullable: false, onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'projectId' }),
    __metadata("design:type", Object)
], WorkflowSuggestion.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], WorkflowSuggestion.prototype, "backgroundUserId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => db_1.User, { nullable: false, onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'backgroundUserId' }),
    __metadata("design:type", Object)
], WorkflowSuggestion.prototype, "backgroundUser", void 0);
__decorate([
    (0, db_1.JsonColumn)(),
    __metadata("design:type", Object)
], WorkflowSuggestion.prototype, "expectedBaseline", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16 }),
    __metadata("design:type", String)
], WorkflowSuggestion.prototype, "state", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16, nullable: true }),
    __metadata("design:type", Object)
], WorkflowSuggestion.prototype, "closedReason", void 0);
__decorate([
    (0, db_1.DateTimeColumn)({ nullable: true }),
    __metadata("design:type", Object)
], WorkflowSuggestion.prototype, "closedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16 }),
    __metadata("design:type", String)
], WorkflowSuggestion.prototype, "resultKind", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], WorkflowSuggestion.prototype, "appliedVersionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], WorkflowSuggestion.prototype, "appliedChecksum", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, nullable: true }),
    __metadata("design:type", Object)
], WorkflowSuggestion.prototype, "appliedAction", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], WorkflowSuggestion.prototype, "appliedActorId", void 0);
__decorate([
    (0, db_1.JsonColumn)(),
    __metadata("design:type", Object)
], WorkflowSuggestion.prototype, "payload", void 0);
exports.WorkflowSuggestion = WorkflowSuggestion = __decorate([
    (0, typeorm_1.Entity)('workflow_suggestion'),
    (0, typeorm_1.Index)(['workflowId'], { unique: true, where: "state = 'pending'" })
], WorkflowSuggestion);
//# sourceMappingURL=workflow-suggestion.entity.js.map