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
exports.InstanceAiThreadTabs = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
const instance_ai_thread_entity_1 = require("./instance-ai-thread.entity");
let InstanceAiThreadTabs = class InstanceAiThreadTabs extends db_1.WithTimestamps {
};
exports.InstanceAiThreadTabs = InstanceAiThreadTabs;
__decorate([
    (0, typeorm_1.ManyToOne)(() => instance_ai_thread_entity_1.InstanceAiThread, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'threadId' }),
    __metadata("design:type", instance_ai_thread_entity_1.InstanceAiThread)
], InstanceAiThreadTabs.prototype, "thread", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'uuid' }),
    __metadata("design:type", String)
], InstanceAiThreadTabs.prototype, "threadId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.ManyToOne)(() => db_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", db_1.User)
], InstanceAiThreadTabs.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'uuid' }),
    __metadata("design:type", String)
], InstanceAiThreadTabs.prototype, "userId", void 0);
__decorate([
    (0, db_1.JsonColumn)(),
    __metadata("design:type", Object)
], InstanceAiThreadTabs.prototype, "state", void 0);
exports.InstanceAiThreadTabs = InstanceAiThreadTabs = __decorate([
    (0, typeorm_1.Entity)({ name: 'instance_ai_thread_tabs' })
], InstanceAiThreadTabs);
//# sourceMappingURL=instance-ai-thread-tabs.entity.js.map