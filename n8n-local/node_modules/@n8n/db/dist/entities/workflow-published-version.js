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
exports.WorkflowPublishedVersion = void 0;
const typeorm_1 = require("@n8n/typeorm");
const abstract_entity_1 = require("./abstract-entity");
let WorkflowPublishedVersion = class WorkflowPublishedVersion extends abstract_entity_1.WithTimestamps {
};
exports.WorkflowPublishedVersion = WorkflowPublishedVersion;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], WorkflowPublishedVersion.prototype, "workflowId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], WorkflowPublishedVersion.prototype, "publishedVersionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('WorkflowEntity', {
        onDelete: 'RESTRICT',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'workflowId' }),
    __metadata("design:type", Object)
], WorkflowPublishedVersion.prototype, "workflow", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('WorkflowHistory', {
        onDelete: 'RESTRICT',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'publishedVersionId', referencedColumnName: 'versionId' }),
    __metadata("design:type", Object)
], WorkflowPublishedVersion.prototype, "publishedVersion", void 0);
exports.WorkflowPublishedVersion = WorkflowPublishedVersion = __decorate([
    (0, typeorm_1.Entity)({ name: 'workflow_published_version' })
], WorkflowPublishedVersion);
//# sourceMappingURL=workflow-published-version.js.map