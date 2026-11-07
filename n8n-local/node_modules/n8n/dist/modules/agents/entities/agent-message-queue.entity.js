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
exports.AgentMessageQueue = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
const agent_execution_thread_entity_1 = require("./agent-execution-thread.entity");
const agent_execution_entity_1 = require("./agent-execution.entity");
const agent_message_entity_1 = require("./agent-message.entity");
let AgentMessageQueue = class AgentMessageQueue extends db_1.WithTimestamps {
};
exports.AgentMessageQueue = AgentMessageQueue;
__decorate([
    (0, typeorm_1.Generated)(),
    (0, typeorm_1.PrimaryColumn)({
        type: db_1.dbType === 'sqlite' ? 'integer' : 'bigint',
        transformer: db_1.idStringifier,
        comment: 'Acceptance order; IDs are not reused',
    }),
    __metadata("design:type", String)
], AgentMessageQueue.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0, comment: 'Pending turn order within the session' }),
    __metadata("design:type", Number)
], AgentMessageQueue.prototype, "position", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => agent_execution_thread_entity_1.AgentExecutionThread, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'threadId' }),
    __metadata("design:type", Object)
], AgentMessageQueue.prototype, "thread", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 128 }),
    __metadata("design:type", String)
], AgentMessageQueue.prototype, "threadId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => agent_message_entity_1.AgentMessageEntity, { nullable: false, onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'messageId', foreignKeyConstraintName: 'FK_agent_message_queue_messageId' }),
    __metadata("design:type", Object)
], AgentMessageQueue.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.Index)({ unique: true }),
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 36,
        comment: 'Canonical input created when the queue accepts it',
    }),
    __metadata("design:type", String)
], AgentMessageQueue.prototype, "messageId", void 0);
__decorate([
    (0, db_1.JsonColumn)({
        comment: 'Dispatch, authorization, and reply context. Input is stored on the message',
    }),
    __metadata("design:type", Object)
], AgentMessageQueue.prototype, "payload", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => agent_execution_entity_1.AgentExecution, { nullable: true, onDelete: 'NO ACTION' }),
    (0, typeorm_1.JoinColumn)({ name: 'executionId' }),
    __metadata("design:type", Object)
], AgentMessageQueue.prototype, "execution", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 36,
        nullable: true,
        comment: 'Current execution; NULL means pending',
    }),
    __metadata("design:type", Object)
], AgentMessageQueue.prototype, "executionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => agent_execution_entity_1.AgentExecution, { nullable: true, onDelete: 'NO ACTION' }),
    (0, typeorm_1.JoinColumn)({ name: 'steeringExecutionId' }),
    __metadata("design:type", Object)
], AgentMessageQueue.prototype, "steeringExecution", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 36,
        nullable: true,
        comment: 'Execution reserved to consume this input',
    }),
    __metadata("design:type", Object)
], AgentMessageQueue.prototype, "steeringExecutionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true, comment: 'Acceptance order among outstanding steers' }),
    __metadata("design:type", Object)
], AgentMessageQueue.prototype, "steeringOrder", void 0);
exports.AgentMessageQueue = AgentMessageQueue = __decorate([
    (0, typeorm_1.Entity)({ name: 'agent_message_queue' }),
    (0, typeorm_1.Index)(['threadId', 'position']),
    (0, typeorm_1.Index)(['threadId'], { unique: true, where: '"executionId" IS NOT NULL' }),
    (0, typeorm_1.Index)(['steeringExecutionId', 'steeringOrder'], {
        unique: true,
        where: '"steeringExecutionId" IS NOT NULL',
    })
], AgentMessageQueue);
//# sourceMappingURL=agent-message-queue.entity.js.map