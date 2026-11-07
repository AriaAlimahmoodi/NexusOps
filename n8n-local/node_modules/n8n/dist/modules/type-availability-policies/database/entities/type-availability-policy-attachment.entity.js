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
exports.TypeAvailabilityPolicyAttachment = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
let TypeAvailabilityPolicyAttachment = class TypeAvailabilityPolicyAttachment extends db_1.WithTimestamps {
};
exports.TypeAvailabilityPolicyAttachment = TypeAvailabilityPolicyAttachment;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], TypeAvailabilityPolicyAttachment.prototype, "scopeId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], TypeAvailabilityPolicyAttachment.prototype, "policyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], TypeAvailabilityPolicyAttachment.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], TypeAvailabilityPolicyAttachment.prototype, "isFloor", void 0);
exports.TypeAvailabilityPolicyAttachment = TypeAvailabilityPolicyAttachment = __decorate([
    (0, typeorm_1.Entity)('type_availability_policy_attachment')
], TypeAvailabilityPolicyAttachment);
//# sourceMappingURL=type-availability-policy-attachment.entity.js.map