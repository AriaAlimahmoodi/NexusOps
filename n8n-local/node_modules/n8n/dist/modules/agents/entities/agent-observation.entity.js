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
exports.AgentObservationEntity = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
let AgentObservationEntity = class AgentObservationEntity extends db_1.WithTimestampsAndStringId {
};
exports.AgentObservationEntity = AgentObservationEntity;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], AgentObservationEntity.prototype, "agentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], AgentObservationEntity.prototype, "observationScopeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16 }),
    __metadata("design:type", String)
], AgentObservationEntity.prototype, "marker", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], AgentObservationEntity.prototype, "text", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], AgentObservationEntity.prototype, "parentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], AgentObservationEntity.prototype, "tokenCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16 }),
    __metadata("design:type", String)
], AgentObservationEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], AgentObservationEntity.prototype, "supersededBy", void 0);
exports.AgentObservationEntity = AgentObservationEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'agents_observations' }),
    (0, typeorm_1.Index)(['agentId', 'observationScopeId', 'status', 'createdAt', 'id']),
    (0, typeorm_1.Index)(['agentId', 'observationScopeId', 'createdAt', 'id']),
    (0, typeorm_1.Index)(['observationScopeId']),
    (0, typeorm_1.Index)(['parentId']),
    (0, typeorm_1.Index)(['supersededBy'])
], AgentObservationEntity);
//# sourceMappingURL=agent-observation.entity.js.map