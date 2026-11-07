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
exports.InstanceAiEventLogEntry = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
const instance_ai_thread_entity_1 = require("./instance-ai-thread.entity");
let InstanceAiEventLogEntry = class InstanceAiEventLogEntry extends db_1.WithTimestamps {
};
exports.InstanceAiEventLogEntry = InstanceAiEventLogEntry;
__decorate([
    (0, typeorm_1.ManyToOne)(() => instance_ai_thread_entity_1.InstanceAiThread, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'threadId' }),
    __metadata("design:type", instance_ai_thread_entity_1.InstanceAiThread)
], InstanceAiEventLogEntry.prototype, "thread", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'uuid' }),
    __metadata("design:type", String)
], InstanceAiEventLogEntry.prototype, "threadId", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'int' }),
    __metadata("design:type", Number)
], InstanceAiEventLogEntry.prototype, "seq", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], InstanceAiEventLogEntry.prototype, "runId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], InstanceAiEventLogEntry.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], InstanceAiEventLogEntry.prototype, "payload", void 0);
exports.InstanceAiEventLogEntry = InstanceAiEventLogEntry = __decorate([
    (0, typeorm_1.Entity)({ name: 'instance_ai_events' }),
    (0, typeorm_1.Index)(['threadId', 'runId'])
], InstanceAiEventLogEntry);
//# sourceMappingURL=instance-ai-event-log-entry.entity.js.map