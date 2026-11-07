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
exports.InstanceAiPendingConfirmation = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
const instance_ai_checkpoint_entity_1 = require("./instance-ai-checkpoint.entity");
const instance_ai_thread_entity_1 = require("./instance-ai-thread.entity");
let InstanceAiPendingConfirmation = class InstanceAiPendingConfirmation extends db_1.WithTimestamps {
};
exports.InstanceAiPendingConfirmation = InstanceAiPendingConfirmation;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], InstanceAiPendingConfirmation.prototype, "requestId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => instance_ai_thread_entity_1.InstanceAiThread, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'threadId' }),
    __metadata("design:type", instance_ai_thread_entity_1.InstanceAiThread)
], InstanceAiPendingConfirmation.prototype, "thread", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], InstanceAiPendingConfirmation.prototype, "threadId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => db_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", db_1.User)
], InstanceAiPendingConfirmation.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], InstanceAiPendingConfirmation.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16 }),
    __metadata("design:type", String)
], InstanceAiPendingConfirmation.prototype, "kind", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], InstanceAiPendingConfirmation.prototype, "runId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], InstanceAiPendingConfirmation.prototype, "toolCallId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], InstanceAiPendingConfirmation.prototype, "messageGroupId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => instance_ai_checkpoint_entity_1.InstanceAiCheckpoint, { onDelete: 'CASCADE', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'checkpointKey', referencedColumnName: 'key' }),
    __metadata("design:type", Object)
], InstanceAiPendingConfirmation.prototype, "checkpoint", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], InstanceAiPendingConfirmation.prototype, "checkpointKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], InstanceAiPendingConfirmation.prototype, "checkpointTaskId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, db_1.DateTimeColumn)({ precision: 3, nullable: true }),
    __metadata("design:type", Object)
], InstanceAiPendingConfirmation.prototype, "expiresAt", void 0);
exports.InstanceAiPendingConfirmation = InstanceAiPendingConfirmation = __decorate([
    (0, typeorm_1.Entity)({ name: 'instance_ai_pending_confirmations' })
], InstanceAiPendingConfirmation);
//# sourceMappingURL=instance-ai-pending-confirmation.entity.js.map