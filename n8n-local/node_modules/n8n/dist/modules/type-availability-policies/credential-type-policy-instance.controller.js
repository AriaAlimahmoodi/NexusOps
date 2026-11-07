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
exports.CredentialTypePolicyInstanceController = void 0;
const api_types_1 = require("@n8n/api-types");
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const constants_2 = require("./constants");
const type_availability_policy_service_1 = require("./type-availability-policy.service");
let CredentialTypePolicyInstanceController = class CredentialTypePolicyInstanceController {
    constructor(service) {
        this.service = service;
    }
    async getInstancePolicy() {
        const effective = await this.service.getEffectivePolicy(constants_2.CREDENTIAL_TYPES_KIND, null);
        return {
            scopeId: effective.scopeId,
            rules: effective.rules,
            defaultAction: effective.defaultAction,
            version: effective.version,
        };
    }
    async putInstancePolicy(req, _res, dto) {
        const result = await this.service.setEffectivePolicy(constants_2.CREDENTIAL_TYPES_KIND, null, { rules: dto.rules, defaultAction: dto.defaultAction }, dto.version, req.user.id);
        return {
            scopeId: result.scopeId,
            rules: result.rules,
            defaultAction: result.defaultAction,
            version: result.version,
            warnings: result.warnings,
        };
    }
    async createPolicy(req, _res, dto) {
        const { policy, warnings } = await this.service.createPolicyDocument(constants_2.CREDENTIAL_TYPES_KIND, dto.rules, req.user.id);
        return { policy, warnings };
    }
    async listPolicies() {
        return await this.service.listPolicyDocuments(constants_2.CREDENTIAL_TYPES_KIND);
    }
    async getPolicy(_req, _res, policyId) {
        const policy = await this.service.getPolicyDocument(constants_2.CREDENTIAL_TYPES_KIND, policyId);
        if (!policy) {
            throw new errors_1.NotFoundError(`Policy document not found: ${policyId}`);
        }
        return policy;
    }
    async updatePolicy(req, _res, policyId, dto) {
        const { policy, warnings } = await this.service.updatePolicyDocument(constants_2.CREDENTIAL_TYPES_KIND, policyId, dto.rules, dto.version, req.user.id);
        return { policy, warnings };
    }
    async deletePolicy(req, _res, policyId) {
        await this.service.deletePolicyDocument(constants_2.CREDENTIAL_TYPES_KIND, policyId, req.user.id);
        return { success: true };
    }
    async getAttachments(_req, _res, scopeId) {
        return await this.service.getAttachments(constants_2.CREDENTIAL_TYPES_KIND, scopeId);
    }
    async replaceAttachments(req, _res, scopeId, dto) {
        return await this.service.replaceAttachments(constants_2.CREDENTIAL_TYPES_KIND, scopeId, dto.attachments, dto.version, req.user.id);
    }
};
exports.CredentialTypePolicyInstanceController = CredentialTypePolicyInstanceController;
__decorate([
    (0, decorators_1.Get)('/instance'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.TYPE_AVAILABILITY_POLICIES),
    (0, decorators_1.GlobalScope)('credentialTypePolicy:manage'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CredentialTypePolicyInstanceController.prototype, "getInstancePolicy", null);
__decorate([
    (0, decorators_1.Put)('/instance'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.TYPE_AVAILABILITY_POLICIES),
    (0, decorators_1.GlobalScope)('credentialTypePolicy:manage'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.PutCredentialTypeInstancePolicyDto]),
    __metadata("design:returntype", Promise)
], CredentialTypePolicyInstanceController.prototype, "putInstancePolicy", null);
__decorate([
    (0, decorators_1.Post)('/policies'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.TYPE_AVAILABILITY_POLICIES),
    (0, decorators_1.GlobalScope)('credentialTypePolicy:manage'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.CreateCredentialTypePolicyDocumentDto]),
    __metadata("design:returntype", Promise)
], CredentialTypePolicyInstanceController.prototype, "createPolicy", null);
__decorate([
    (0, decorators_1.Get)('/policies'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.TYPE_AVAILABILITY_POLICIES),
    (0, decorators_1.GlobalScope)('credentialTypePolicy:manage'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CredentialTypePolicyInstanceController.prototype, "listPolicies", null);
__decorate([
    (0, decorators_1.Get)('/policies/:policyId'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.TYPE_AVAILABILITY_POLICIES),
    (0, decorators_1.GlobalScope)('credentialTypePolicy:manage'),
    __param(2, (0, decorators_1.Param)('policyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], CredentialTypePolicyInstanceController.prototype, "getPolicy", null);
__decorate([
    (0, decorators_1.Patch)('/policies/:policyId'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.TYPE_AVAILABILITY_POLICIES),
    (0, decorators_1.GlobalScope)('credentialTypePolicy:manage'),
    __param(2, (0, decorators_1.Param)('policyId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.UpdateCredentialTypePolicyDocumentDto]),
    __metadata("design:returntype", Promise)
], CredentialTypePolicyInstanceController.prototype, "updatePolicy", null);
__decorate([
    (0, decorators_1.Delete)('/policies/:policyId'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.TYPE_AVAILABILITY_POLICIES),
    (0, decorators_1.GlobalScope)('credentialTypePolicy:manage'),
    __param(2, (0, decorators_1.Param)('policyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], CredentialTypePolicyInstanceController.prototype, "deletePolicy", null);
__decorate([
    (0, decorators_1.Get)('/scopes/:scopeId/attachments'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.TYPE_AVAILABILITY_POLICIES),
    (0, decorators_1.GlobalScope)('credentialTypePolicy:manage'),
    __param(2, (0, decorators_1.Param)('scopeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], CredentialTypePolicyInstanceController.prototype, "getAttachments", null);
__decorate([
    (0, decorators_1.Put)('/scopes/:scopeId/attachments'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.TYPE_AVAILABILITY_POLICIES),
    (0, decorators_1.GlobalScope)('credentialTypePolicy:manage'),
    __param(2, (0, decorators_1.Param)('scopeId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.ReplaceAttachmentsDto]),
    __metadata("design:returntype", Promise)
], CredentialTypePolicyInstanceController.prototype, "replaceAttachments", null);
exports.CredentialTypePolicyInstanceController = CredentialTypePolicyInstanceController = __decorate([
    (0, decorators_1.RestController)('/credential-type-policies'),
    __metadata("design:paramtypes", [type_availability_policy_service_1.TypeAvailabilityPolicyService])
], CredentialTypePolicyInstanceController);
//# sourceMappingURL=credential-type-policy-instance.controller.js.map