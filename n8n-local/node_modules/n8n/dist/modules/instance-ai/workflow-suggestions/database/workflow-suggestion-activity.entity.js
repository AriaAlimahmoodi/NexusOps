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
exports.WorkflowSuggestionActivity = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
const workflow_suggestion_entity_1 = require("./workflow-suggestion.entity");
let WorkflowSuggestionActivity = class WorkflowSuggestionActivity extends db_1.WithTimestampsAndStringId {
};
exports.WorkflowSuggestionActivity = WorkflowSuggestionActivity;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], WorkflowSuggestionActivity.prototype, "suggestionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => workflow_suggestion_entity_1.WorkflowSuggestion, { nullable: false, onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'suggestionId' }),
    __metadata("design:type", Object)
], WorkflowSuggestionActivity.prototype, "suggestion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16 }),
    __metadata("design:type", Object)
], WorkflowSuggestionActivity.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16 }),
    __metadata("design:type", Object)
], WorkflowSuggestionActivity.prototype, "author", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], WorkflowSuggestionActivity.prototype, "actorId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => db_1.User, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'actorId' }),
    __metadata("design:type", Object)
], WorkflowSuggestionActivity.prototype, "actor", void 0);
exports.WorkflowSuggestionActivity = WorkflowSuggestionActivity = __decorate([
    (0, typeorm_1.Entity)('workflow_suggestion_activity'),
    (0, typeorm_1.Index)(['suggestionId', 'action'], { unique: true })
], WorkflowSuggestionActivity);
//# sourceMappingURL=workflow-suggestion-activity.entity.js.map