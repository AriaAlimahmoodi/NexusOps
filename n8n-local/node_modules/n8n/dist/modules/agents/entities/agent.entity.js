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
exports.Agent = void 0;
exports.isProjectAgent = isProjectAgent;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
function isProjectAgent(agent) {
    if ('scope' in agent && agent.scope === 'instance')
        return false;
    return agent.projectId !== null;
}
let Agent = class Agent extends db_1.WithTimestampsAndStringId {
};
exports.Agent = Agent;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 128 }),
    __metadata("design:type", String)
], Agent.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => db_1.Project, { onDelete: 'CASCADE', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'projectId' }),
    __metadata("design:type", Object)
], Agent.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], Agent.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16, default: 'project' }),
    __metadata("design:type", String)
], Agent.prototype, "scope", void 0);
__decorate([
    (0, db_1.JsonColumn)({ nullable: true, default: null }),
    __metadata("design:type", Object)
], Agent.prototype, "schema", void 0);
__decorate([
    (0, db_1.JsonColumn)({ default: '[]' }),
    __metadata("design:type", Array)
], Agent.prototype, "integrations", void 0);
__decorate([
    (0, db_1.JsonColumn)({ default: '{}' }),
    __metadata("design:type", Object)
], Agent.prototype, "tools", void 0);
__decorate([
    (0, db_1.JsonColumn)({ default: '{}' }),
    __metadata("design:type", Object)
], Agent.prototype, "skills", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Agent.prototype, "availableInMCP", void 0);
__decorate([
    (0, db_1.DateTimeColumn)({ nullable: true }),
    __metadata("design:type", Object)
], Agent.prototype, "setupCompletedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], Agent.prototype, "versionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], Agent.prototype, "activeVersionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('AgentHistory', { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'activeVersionId' }),
    __metadata("design:type", Object)
], Agent.prototype, "activeVersion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Agent.prototype, "revision", void 0);
exports.Agent = Agent = __decorate([
    (0, typeorm_1.Entity)({ name: 'agents' })
], Agent);
//# sourceMappingURL=agent.entity.js.map