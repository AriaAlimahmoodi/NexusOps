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
exports.TypeAvailabilityPolicyScope = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
let TypeAvailabilityPolicyScope = class TypeAvailabilityPolicyScope extends db_1.WithTimestampsAndStringId {
};
exports.TypeAvailabilityPolicyScope = TypeAvailabilityPolicyScope;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], TypeAvailabilityPolicyScope.prototype, "kind", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], TypeAvailabilityPolicyScope.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16 }),
    __metadata("design:type", String)
], TypeAvailabilityPolicyScope.prototype, "defaultAction", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], TypeAvailabilityPolicyScope.prototype, "version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], TypeAvailabilityPolicyScope.prototype, "updatedBy", void 0);
exports.TypeAvailabilityPolicyScope = TypeAvailabilityPolicyScope = __decorate([
    (0, typeorm_1.Entity)('type_availability_policy_scope')
], TypeAvailabilityPolicyScope);
//# sourceMappingURL=type-availability-policy-scope.entity.js.map