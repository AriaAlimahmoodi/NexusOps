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
exports.AgentBackgroundJob = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
let AgentBackgroundJob = class AgentBackgroundJob extends db_1.WithTimestampsAndStringId {
};
exports.AgentBackgroundJob = AgentBackgroundJob;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16 }),
    __metadata("design:type", String)
], AgentBackgroundJob.prototype, "kind", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16 }),
    __metadata("design:type", String)
], AgentBackgroundJob.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true, comment: 'Groups jobs stopped by one user request' }),
    __metadata("design:type", Object)
], AgentBackgroundJob.prototype, "pauseRequestId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], AgentBackgroundJob.prototype, "parentAgentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 128 }),
    __metadata("design:type", String)
], AgentBackgroundJob.prototype, "parentThreadId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], AgentBackgroundJob.prototype, "parentResourceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], AgentBackgroundJob.prototype, "parentPrincipalHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], AgentBackgroundJob.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], AgentBackgroundJob.prototype, "subAgentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 128, nullable: true }),
    __metadata("design:type", Object)
], AgentBackgroundJob.prototype, "childThreadId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], AgentBackgroundJob.prototype, "childExecutionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], AgentBackgroundJob.prototype, "workflowId", void 0);
__decorate([
    (0, db_1.DateTimeColumn)({ precision: 3, nullable: true }),
    __metadata("design:type", Object)
], AgentBackgroundJob.prototype, "timeoutAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], AgentBackgroundJob.prototype, "result", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], AgentBackgroundJob.prototype, "error", void 0);
__decorate([
    (0, db_1.DateTimeColumn)({ precision: 3, nullable: true }),
    __metadata("design:type", Object)
], AgentBackgroundJob.prototype, "settledAt", void 0);
__decorate([
    (0, db_1.DateTimeColumn)({ precision: 3, nullable: true }),
    __metadata("design:type", Object)
], AgentBackgroundJob.prototype, "notifiedAt", void 0);
exports.AgentBackgroundJob = AgentBackgroundJob = __decorate([
    (0, typeorm_1.Entity)({ name: 'agent_background_job' }),
    (0, typeorm_1.Index)(['parentThreadId', 'status']),
    (0, typeorm_1.Index)(['parentAgentId']),
    (0, typeorm_1.Index)(['settledAt']),
    (0, typeorm_1.Index)(['childExecutionId'], { unique: true, where: '"childExecutionId" IS NOT NULL' }),
    (0, typeorm_1.Index)(['timeoutAt'], { where: "\"status\" IN ('running', 'suspended')" }),
    (0, typeorm_1.Index)(['parentThreadId'], { where: '"status" <> \'running\' AND "notifiedAt" IS NULL' })
], AgentBackgroundJob);
//# sourceMappingURL=agent-background-job.entity.js.map