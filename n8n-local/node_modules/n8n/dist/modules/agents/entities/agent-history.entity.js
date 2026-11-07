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
exports.AgentHistory = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
let AgentHistory = class AgentHistory extends db_1.WithTimestamps {
};
exports.AgentHistory = AgentHistory;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], AgentHistory.prototype, "versionId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], AgentHistory.prototype, "agentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('Agent', { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'agentId' }),
    __metadata("design:type", Object)
], AgentHistory.prototype, "agent", void 0);
__decorate([
    (0, db_1.JsonColumn)({ nullable: true, default: null }),
    __metadata("design:type", Object)
], AgentHistory.prototype, "schema", void 0);
__decorate([
    (0, db_1.JsonColumn)({ nullable: true, default: null }),
    __metadata("design:type", Object)
], AgentHistory.prototype, "tools", void 0);
__decorate([
    (0, db_1.JsonColumn)({ nullable: true, default: null }),
    __metadata("design:type", Object)
], AgentHistory.prototype, "skills", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], AgentHistory.prototype, "publishedById", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], AgentHistory.prototype, "author", void 0);
exports.AgentHistory = AgentHistory = __decorate([
    (0, typeorm_1.Entity)({ name: 'agent_history' })
], AgentHistory);
//# sourceMappingURL=agent-history.entity.js.map