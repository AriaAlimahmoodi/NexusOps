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
exports.CredentialTypePolicyProjectController = void 0;
const api_types_1 = require("@n8n/api-types");
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const constants_2 = require("./constants");
const type_availability_policy_service_1 = require("./type-availability-policy.service");
let CredentialTypePolicyProjectController = class CredentialTypePolicyProjectController {
    constructor(service) {
        this.service = service;
    }
    async getProjectPolicy(req) {
        const effective = await this.service.getEffectivePolicy(constants_2.CREDENTIAL_TYPES_KIND, req.params.projectId);
        return {
            scopeId: effective.scopeId,
            rules: effective.rules,
            defaultAction: effective.defaultAction,
            version: effective.version,
        };
    }
    async putProjectPolicy(req, _res, dto) {
        const result = await this.service.setEffectivePolicy(constants_2.CREDENTIAL_TYPES_KIND, req.params.projectId, { rules: dto.rules, defaultAction: dto.defaultAction }, dto.version, req.user.id);
        return {
            scopeId: result.scopeId,
            rules: result.rules,
            defaultAction: result.defaultAction,
            version: result.version,
            warnings: result.warnings,
        };
    }
};
exports.CredentialTypePolicyProjectController = CredentialTypePolicyProjectController;
__decorate([
    (0, decorators_1.Get)('/project'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.TYPE_AVAILABILITY_POLICIES),
    (0, decorators_1.ProjectScope)('credentialTypePolicy:manage'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CredentialTypePolicyProjectController.prototype, "getProjectPolicy", null);
__decorate([
    (0, decorators_1.Put)('/project'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.TYPE_AVAILABILITY_POLICIES),
    (0, decorators_1.ProjectScope)('credentialTypePolicy:manage'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.PutCredentialTypeProjectPolicyDto]),
    __metadata("design:returntype", Promise)
], CredentialTypePolicyProjectController.prototype, "putProjectPolicy", null);
exports.CredentialTypePolicyProjectController = CredentialTypePolicyProjectController = __decorate([
    (0, decorators_1.RestController)('/projects/:projectId/credential-type-policies'),
    __metadata("design:paramtypes", [type_availability_policy_service_1.TypeAvailabilityPolicyService])
], CredentialTypePolicyProjectController);
//# sourceMappingURL=credential-type-policy-project.controller.js.map