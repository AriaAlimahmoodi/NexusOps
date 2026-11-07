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
exports.AgentMemoryEntryLockEntity = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
let AgentMemoryEntryLockEntity = class AgentMemoryEntryLockEntity extends db_1.WithTimestamps {
};
exports.AgentMemoryEntryLockEntity = AgentMemoryEntryLockEntity;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], AgentMemoryEntryLockEntity.prototype, "agentId", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], AgentMemoryEntryLockEntity.prototype, "resourceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], AgentMemoryEntryLockEntity.prototype, "holderId", void 0);
__decorate([
    (0, db_1.DateTimeColumn)(),
    __metadata("design:type", Date)
], AgentMemoryEntryLockEntity.prototype, "heldUntil", void 0);
exports.AgentMemoryEntryLockEntity = AgentMemoryEntryLockEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'agents_memory_entry_locks' }),
    (0, typeorm_1.Index)(['resourceId'])
], AgentMemoryEntryLockEntity);
//# sourceMappingURL=agent-memory-entry-lock.entity.js.map