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
exports.CredentialTypePoliciesPublicController = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
const constants_2 = require("../../../modules/type-availability-policies/constants");
const pagination_service_1 = require("../../../public-api/v1/shared/services/pagination.service");
const tags = ['CredentialTypePolicy'];
function toPublicDocument(policy) {
    return {
        id: policy.id,
        kind: policy.kind,
        rules: [...policy.rules],
        version: policy.version,
        updatedBy: policy.updatedBy,
        createdAt: policy.createdAt.toISOString(),
        updatedAt: policy.updatedAt.toISOString(),
    };
}
function toPublicAttachments(result) {
    return {
        attachments: result.attachments.map((attachment) => ({
            policyId: attachment.policyId,
            rules: [...attachment.rules],
            priority: attachment.priority,
            isFloor: attachment.isFloor,
        })),
        version: result.version,
    };
}
let CredentialTypePoliciesPublicController = class CredentialTypePoliciesPublicController {
    constructor(moduleRegistry) {
        this.moduleRegistry = moduleRegistry;
    }
    async service() {
        if (!this.moduleRegistry.isActive('type-availability-policies')) {
            throw new errors_1.ServiceUnavailableError('Credential type policies module is not enabled');
        }
        const { TypeAvailabilityPolicyService } = await import('../../../modules/type-availability-policies/type-availability-policy.service.js');
        return di_1.Container.get(TypeAvailabilityPolicyService);
    }
    async getCredentialTypeInstancePolicy() {
        const effective = await (await this.service()).getEffectivePolicy(constants_2.CREDENTIAL_TYPES_KIND, null);
        return {
            scopeId: effective.scopeId,
            rules: [...effective.rules],
            defaultAction: effective.defaultAction,
            version: effective.version,
        };
    }
    async putCredentialTypeInstancePolicy(req, _res, dto) {
        const result = await (await this.service()).setEffectivePolicy(constants_2.CREDENTIAL_TYPES_KIND, null, { rules: dto.rules, defaultAction: dto.defaultAction }, dto.version, req.user.id);
        return {
            scopeId: result.scopeId,
            rules: result.rules,
            defaultAction: result.defaultAction,
            version: result.version,
            warnings: [...result.warnings],
        };
    }
    async getCredentialTypeProjectPolicy(_req, _res, projectId) {
        const effective = await (await this.service()).getEffectivePolicy(constants_2.CREDENTIAL_TYPES_KIND, projectId);
        return {
            scopeId: effective.scopeId,
            rules: [...effective.rules],
            defaultAction: effective.defaultAction,
            version: effective.version,
        };
    }
    async putCredentialTypeProjectPolicy(req, _res, projectId, dto) {
        const result = await (await this.service()).setEffectivePolicy(constants_2.CREDENTIAL_TYPES_KIND, projectId, { rules: dto.rules, defaultAction: dto.defaultAction }, dto.version, req.user.id);
        return {
            scopeId: result.scopeId,
            rules: result.rules,
            defaultAction: result.defaultAction,
            version: result.version,
            warnings: [...result.warnings],
        };
    }
    async listCredentialTypePolicyDocuments(_req, _res, query) {
        const { offset, limit } = (0, pagination_service_1.resolveOffsetPagination)(query);
        const { items, count } = await (await this.service()).listPolicyDocumentsPage(constants_2.CREDENTIAL_TYPES_KIND, offset, limit);
        return {
            data: items.map(toPublicDocument),
            nextCursor: (0, pagination_service_1.encodeNextCursor)({ offset, limit, numberOfTotalRecords: count }),
        };
    }
    async createCredentialTypePolicyDocument(req, _res, dto) {
        const { policy, warnings } = await (await this.service()).createPolicyDocument(constants_2.CREDENTIAL_TYPES_KIND, dto.rules, req.user.id);
        return { policy: toPublicDocument(policy), warnings: [...warnings] };
    }
    async getCredentialTypePolicyDocument(_req, _res, policyId) {
        const policy = await (await this.service()).getPolicyDocument(constants_2.CREDENTIAL_TYPES_KIND, policyId);
        if (!policy) {
            throw new errors_1.NotFoundError(`Policy document not found: ${policyId}`);
        }
        return toPublicDocument(policy);
    }
    async updateCredentialTypePolicyDocument(req, _res, policyId, dto) {
        const { policy, warnings } = await (await this.service()).updatePolicyDocument(constants_2.CREDENTIAL_TYPES_KIND, policyId, dto.rules, dto.version, req.user.id);
        return { policy: toPublicDocument(policy), warnings: [...warnings] };
    }
    async deleteCredentialTypePolicyDocument(req, _res, policyId) {
        await (await this.service()).deletePolicyDocument(constants_2.CREDENTIAL_TYPES_KIND, policyId, req.user.id);
    }
    async getCredentialTypePolicyAttachments(_req, _res, scopeId) {
        const result = await (await this.service()).getAttachments(constants_2.CREDENTIAL_TYPES_KIND, scopeId);
        return toPublicAttachments(result);
    }
    async replaceCredentialTypePolicyAttachments(req, _res, scopeId, dto) {
        const result = await (await this.service()).replaceAttachments(constants_2.CREDENTIAL_TYPES_KIND, scopeId, dto.attachments, dto.version, req.user.id);
        return toPublicAttachments(result);
    }
};
exports.CredentialTypePoliciesPublicController = CredentialTypePoliciesPublicController;
__decorate([
    (0, decorators_1.Get)('/instance'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.TYPE_AVAILABILITY_POLICIES),
    (0, decorators_1.ApiKeyScope)('credentialTypePolicy:manage'),
    (0, decorators_1.GlobalScope)('credentialTypePolicy:manage'),
    (0, decorators_1.ApiSummary)('Preview: Retrieve the instance credential type policy'),
    (0, decorators_1.ApiDescription)('**Preview** — breaking changes may still occur without major version bump.\n\nReturns the composed instance-scope policy: its default action and the rules of every attached policy document in evaluation order. An instance that was never configured reports `scopeId: null`, no rules, `defaultAction: allow`, and `version: 0`.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.CredentialTypePolicyEffectivePublicDto),
    (0, decorators_1.ApiErrorResponse)(503),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CredentialTypePoliciesPublicController.prototype, "getCredentialTypeInstancePolicy", null);
__decorate([
    (0, decorators_1.Put)('/instance'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.TYPE_AVAILABILITY_POLICIES),
    (0, decorators_1.ApiKeyScope)('credentialTypePolicy:manage'),
    (0, decorators_1.GlobalScope)('credentialTypePolicy:manage'),
    (0, decorators_1.ApiSummary)('Preview: Replace the instance credential type policy'),
    (0, decorators_1.ApiDescription)('**Preview** — breaking changes may still occur without major version bump.\n\nSets the instance default action and replaces the rules of its single policy document, creating both on first write. `version` must equal the version last read; a stale value is rejected with 409. Rule ids must be unique within the list.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.CredentialTypePolicyEffectiveWriteResultPublicDto),
    (0, decorators_1.ApiErrorResponse)(409),
    (0, decorators_1.ApiErrorResponse)(503),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.PutCredentialTypeInstancePolicyDto]),
    __metadata("design:returntype", Promise)
], CredentialTypePoliciesPublicController.prototype, "putCredentialTypeInstancePolicy", null);
__decorate([
    (0, decorators_1.Get)('/projects/:projectId'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.TYPE_AVAILABILITY_POLICIES),
    (0, decorators_1.ApiKeyScope)('credentialTypePolicy:manage'),
    (0, decorators_1.ProjectScope)('credentialTypePolicy:manage'),
    (0, decorators_1.ApiSummary)("Preview: Retrieve a project's credential type policy"),
    (0, decorators_1.ApiDescription)("**Preview** — breaking changes may still occur without major version bump.\n\nReturns the project's own composed policy, not the result of combining it with the instance policy. A project that was never configured reports `scopeId: null`, no rules, `defaultAction: allow`, and `version: 0`."),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.CredentialTypePolicyEffectivePublicDto),
    (0, decorators_1.ApiErrorResponse)(503),
    __param(2, (0, decorators_1.Param)('projectId', api_types_1.projectIdParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], CredentialTypePoliciesPublicController.prototype, "getCredentialTypeProjectPolicy", null);
__decorate([
    (0, decorators_1.Put)('/projects/:projectId'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.TYPE_AVAILABILITY_POLICIES),
    (0, decorators_1.ApiKeyScope)('credentialTypePolicy:manage'),
    (0, decorators_1.ProjectScope)('credentialTypePolicy:manage'),
    (0, decorators_1.ApiSummary)("Preview: Replace a project's credential type policy"),
    (0, decorators_1.ApiDescription)("**Preview** — breaking changes may still occur without major version bump.\n\nSets the project's default action and replaces the rules of its single policy document, creating both on first write. The `delegate` action is not accepted at project scope. `version` must equal the version last read; a stale value is rejected with 409, as is a project document that is shared with another scope."),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.CredentialTypePolicyEffectiveWriteResultPublicDto),
    (0, decorators_1.ApiErrorResponse)(409),
    (0, decorators_1.ApiErrorResponse)(503),
    __param(2, (0, decorators_1.Param)('projectId', api_types_1.projectIdParamSchema)),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.PutCredentialTypeProjectPolicyDto]),
    __metadata("design:returntype", Promise)
], CredentialTypePoliciesPublicController.prototype, "putCredentialTypeProjectPolicy", null);
__decorate([
    (0, decorators_1.Get)('/policies'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.TYPE_AVAILABILITY_POLICIES),
    (0, decorators_1.ApiKeyScope)('credentialTypePolicy:manage'),
    (0, decorators_1.GlobalScope)('credentialTypePolicy:manage'),
    (0, decorators_1.ApiSummary)('Preview: List credential type policy documents'),
    (0, decorators_1.ApiDescription)('**Preview** — breaking changes may still occur without major version bump.\n\nReturns a cursor-paginated list of reusable policy documents.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.CredentialTypePolicyDocumentListPublicDto),
    (0, decorators_1.ApiErrorResponse)(503),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.ListNodeTypePolicyDocumentsQueryDto]),
    __metadata("design:returntype", Promise)
], CredentialTypePoliciesPublicController.prototype, "listCredentialTypePolicyDocuments", null);
__decorate([
    (0, decorators_1.Post)('/policies'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.TYPE_AVAILABILITY_POLICIES),
    (0, decorators_1.ApiKeyScope)('credentialTypePolicy:manage'),
    (0, decorators_1.GlobalScope)('credentialTypePolicy:manage'),
    (0, decorators_1.ApiSummary)('Preview: Create a credential type policy document'),
    (0, decorators_1.ApiDescription)('**Preview** — breaking changes may still occur without major version bump.\n\nCreates a reusable policy document that is not yet attached to any scope. Rule ids must be unique within the list. `warnings` lists rules that an earlier rule already shadows.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(201, api_types_1.CredentialTypePolicyDocumentWriteResultPublicDto),
    (0, decorators_1.ApiErrorResponse)(503),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.CreateCredentialTypePolicyDocumentDto]),
    __metadata("design:returntype", Promise)
], CredentialTypePoliciesPublicController.prototype, "createCredentialTypePolicyDocument", null);
__decorate([
    (0, decorators_1.Get)('/policies/:policyId'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.TYPE_AVAILABILITY_POLICIES),
    (0, decorators_1.ApiKeyScope)('credentialTypePolicy:manage'),
    (0, decorators_1.GlobalScope)('credentialTypePolicy:manage'),
    (0, decorators_1.ApiSummary)('Preview: Retrieve a credential type policy document'),
    (0, decorators_1.ApiDescription)('**Preview** — breaking changes may still occur without major version bump.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.CredentialTypePolicyDocumentPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(503),
    __param(2, (0, decorators_1.Param)('policyId', api_types_1.credentialTypePolicyIdParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], CredentialTypePoliciesPublicController.prototype, "getCredentialTypePolicyDocument", null);
__decorate([
    (0, decorators_1.Put)('/policies/:policyId'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.TYPE_AVAILABILITY_POLICIES),
    (0, decorators_1.ApiKeyScope)('credentialTypePolicy:manage'),
    (0, decorators_1.GlobalScope)('credentialTypePolicy:manage'),
    (0, decorators_1.ApiSummary)('Preview: Replace the rules of a credential type policy document'),
    (0, decorators_1.ApiDescription)("**Preview** — breaking changes may still occur without major version bump.\n\nReplaces the document's whole rule list. `version` must equal the version last read; a stale value is rejected with 409. Every scope the document is attached to has its version bumped. A `delegate` rule is rejected when the document is attached to a project scope."),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.CredentialTypePolicyDocumentWriteResultPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(409),
    (0, decorators_1.ApiErrorResponse)(503),
    __param(2, (0, decorators_1.Param)('policyId', api_types_1.credentialTypePolicyIdParamSchema)),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.UpdateCredentialTypePolicyDocumentDto]),
    __metadata("design:returntype", Promise)
], CredentialTypePoliciesPublicController.prototype, "updateCredentialTypePolicyDocument", null);
__decorate([
    (0, decorators_1.Delete)('/policies/:policyId'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.TYPE_AVAILABILITY_POLICIES),
    (0, decorators_1.ApiKeyScope)('credentialTypePolicy:manage'),
    (0, decorators_1.GlobalScope)('credentialTypePolicy:manage'),
    (0, decorators_1.ApiSummary)('Preview: Delete a credential type policy document'),
    (0, decorators_1.ApiDescription)('**Preview** — breaking changes may still occur without major version bump.\n\nDeletes a policy document. A document that is still attached to a scope is rejected with 409; detach it first.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(204),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(409),
    (0, decorators_1.ApiErrorResponse)(503),
    __param(2, (0, decorators_1.Param)('policyId', api_types_1.credentialTypePolicyIdParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], CredentialTypePoliciesPublicController.prototype, "deleteCredentialTypePolicyDocument", null);
__decorate([
    (0, decorators_1.Get)('/scopes/:scopeId/attachments'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.TYPE_AVAILABILITY_POLICIES),
    (0, decorators_1.ApiKeyScope)('credentialTypePolicy:manage'),
    (0, decorators_1.GlobalScope)('credentialTypePolicy:manage'),
    (0, decorators_1.ApiSummary)("Preview: Retrieve a scope's attached policy documents"),
    (0, decorators_1.ApiDescription)('**Preview** — breaking changes may still occur without major version bump.\n\nReturns every attached policy document and the scope version. Attachments use evaluation order: floor first, then priority ascending within each group. Use this version when replacing the attachments. `scopeId` comes from `GET /instance` or `GET /projects/{projectId}`, and is null until the scope is first written. This route needs instance-level access, also for a project scope.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.CredentialTypePolicyAttachmentsPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(503),
    __param(2, (0, decorators_1.Param)('scopeId', api_types_1.credentialTypePolicyScopeIdParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], CredentialTypePoliciesPublicController.prototype, "getCredentialTypePolicyAttachments", null);
__decorate([
    (0, decorators_1.Put)('/scopes/:scopeId/attachments'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.TYPE_AVAILABILITY_POLICIES),
    (0, decorators_1.ApiKeyScope)('credentialTypePolicy:manage'),
    (0, decorators_1.GlobalScope)('credentialTypePolicy:manage'),
    (0, decorators_1.ApiSummary)("Preview: Replace a scope's attached policy documents"),
    (0, decorators_1.ApiDescription)("**Preview** — breaking changes may still occur without major version bump.\n\nReplaces every attachment on a scope. `scopeId` comes from the scope's `GET` response once it has been written. Each `policyId` and each `(isFloor, priority)` pair must be unique within the list. `version` must match the current scope version. A stale version returns 409 without changes. A successful write bumps the scope's version."),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.CredentialTypePolicyAttachmentsPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(409),
    (0, decorators_1.ApiErrorResponse)(503),
    __param(2, (0, decorators_1.Param)('scopeId', api_types_1.credentialTypePolicyScopeIdParamSchema)),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.ReplaceAttachmentsDto]),
    __metadata("design:returntype", Promise)
], CredentialTypePoliciesPublicController.prototype, "replaceCredentialTypePolicyAttachments", null);
exports.CredentialTypePoliciesPublicController = CredentialTypePoliciesPublicController = __decorate([
    (0, decorators_1.PublicApiController)('/credential-type-policies'),
    __metadata("design:paramtypes", [backend_common_1.ModuleRegistry])
], CredentialTypePoliciesPublicController);
//# sourceMappingURL=credential-type-policies.public.controller.js.map