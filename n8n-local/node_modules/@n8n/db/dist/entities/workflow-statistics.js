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
exports.WorkflowStatistics = void 0;
const typeorm_1 = require("@n8n/typeorm");
const abstract_entity_1 = require("./abstract-entity");
const transformers_1 = require("../utils/transformers");
let WorkflowStatistics = class WorkflowStatistics {
};
exports.WorkflowStatistics = WorkflowStatistics;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], WorkflowStatistics.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', transformer: transformers_1.bigintStringToNumber }),
    __metadata("design:type", Number)
], WorkflowStatistics.prototype, "count", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', transformer: transformers_1.bigintStringToNumber }),
    __metadata("design:type", Number)
], WorkflowStatistics.prototype, "rootCount", void 0);
__decorate([
    (0, abstract_entity_1.DateTimeColumn)(),
    __metadata("design:type", Date)
], WorkflowStatistics.prototype, "latestEvent", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 128 }),
    __metadata("design:type", String)
], WorkflowStatistics.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], WorkflowStatistics.prototype, "workflowId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 128, nullable: true }),
    __metadata("design:type", Object)
], WorkflowStatistics.prototype, "workflowName", void 0);
exports.WorkflowStatistics = WorkflowStatistics = __decorate([
    (0, typeorm_1.Entity)()
], WorkflowStatistics);
//# sourceMappingURL=workflow-statistics.js.map