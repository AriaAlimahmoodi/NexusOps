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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvailableTypesController = void 0;
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const node_types_1 = require("../../node-types");
const constants_2 = require("./constants");
const type_availability_policy_service_1 = require("./type-availability-policy.service");
function toAvailabilityEntry(verdict) {
    if (verdict.action === 'allow')
        return { name: verdict.name, available: true };
    return {
        name: verdict.name,
        available: false,
        scope: verdict.scope,
        ...(verdict.matchedRuleId !== null && { matchedRuleId: verdict.matchedRuleId }),
        ...(verdict.optInAvailable && { optInAvailable: true }),
    };
}
let AvailableTypesController = class AvailableTypesController {
    constructor(service, nodeTypes) {
        this.service = service;
        this.nodeTypes = nodeTypes;
    }
    async getAvailableTypes(_req, _res, projectId) {
        const typeNames = Object.keys(this.nodeTypes.getKnownTypes());
        const verdicts = await this.service.evaluateComposedTypes(constants_2.NODE_TYPES_KIND, projectId, typeNames);
        return verdicts.map(toAvailabilityEntry);
    }
};
exports.AvailableTypesController = AvailableTypesController;
__decorate([
    (0, decorators_1.Get)('/'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.TYPE_AVAILABILITY_POLICIES),
    (0, decorators_1.ProjectScope)('project:read'),
    __param(2, (0, decorators_1.Param)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], AvailableTypesController.prototype, "getAvailableTypes", null);
exports.AvailableTypesController = AvailableTypesController = __decorate([
    (0, decorators_1.RestController)('/projects/:projectId/available-types'),
    __metadata("design:paramtypes", [type_availability_policy_service_1.TypeAvailabilityPolicyService, node_types_1.NodeTypes])
], AvailableTypesController);
//# sourceMappingURL=available-types.controller.js.map