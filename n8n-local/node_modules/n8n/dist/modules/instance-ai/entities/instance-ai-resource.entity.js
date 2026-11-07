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
exports.InstanceAiResource = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
let InstanceAiResource = class InstanceAiResource extends db_1.WithTimestamps {
};
exports.InstanceAiResource = InstanceAiResource;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], InstanceAiResource.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], InstanceAiResource.prototype, "workingMemory", void 0);
__decorate([
    (0, db_1.JsonColumn)({ nullable: true }),
    __metadata("design:type", Object)
], InstanceAiResource.prototype, "metadata", void 0);
exports.InstanceAiResource = InstanceAiResource = __decorate([
    (0, typeorm_1.Entity)({ name: 'instance_ai_resources' })
], InstanceAiResource);
//# sourceMappingURL=instance-ai-resource.entity.js.map