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
exports.N8nPackagesPublicController = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const n8n_workflow_1 = require("n8n-workflow");
const package_export_errors_1 = require("../../../modules/n8n-packages/entities/package-export.errors");
const n8n_packages_service_1 = require("../../../modules/n8n-packages/n8n-packages.service");
const package_failure_classifier_1 = require("../../../modules/n8n-packages/package-failure-classifier");
const import_package_upload_1 = require("../../../modules/n8n-packages/utils/import-package-upload");
const n8n_packages_openapi_1 = require("./openapi/n8n-packages.openapi");
const EXPORT_COUNTS_HEADER = 'X-N8n-Export-Counts';
function uploadLimits(maxParts) {
    const maxFileSizeBytes = di_1.Container.get(config_1.GlobalConfig).endpoints.payloadSizeMax * 1024 * 1024;
    return {
        fileSize: maxFileSizeBytes,
        files: 1,
        parts: maxParts,
        fieldSize: import_package_upload_1.IMPORT_PACKAGE_FIELD_SIZE_BYTES,
    };
}
function assertPackageExportApiKeyScopes(apiKeyScopes, agentIds, workflowIds, folderIds, projectIds) {
    if (!apiKeyScopes) {
        throw new errors_1.ForbiddenError('Forbidden');
    }
    const requiredScopes = [];
    if (agentIds.length > 0) {
        requiredScopes.push('agent:export');
    }
    if (workflowIds.length > 0 || folderIds.length > 0) {
        requiredScopes.push('workflow:export');
    }
    if (projectIds.length > 0) {
        requiredScopes.push('project:export');
    }
    for (const scope of requiredScopes) {
        if (!apiKeyScopes.includes(scope)) {
            throw new errors_1.ForbiddenError('Forbidden');
        }
    }
    return apiKeyScopes;
}
let N8nPackagesPublicController = class N8nPackagesPublicController {
    constructor(n8nPackagesService, eventService) {
        this.n8nPackagesService = n8nPackagesService;
        this.eventService = eventService;
    }
    async importPackage(req, _res, body) {
        const { package: file, bindings, projectId, folderId, ...policies } = body;
        try {
            return await this.n8nPackagesService.importPackage({
                user: req.user,
                apiKeyScopes: req.tokenGrant?.apiKeyScopes,
                projectId,
                folderId,
                bindings: {
                    credentials: new Map(Object.entries(bindings.credentials ?? {})),
                },
                packageBuffer: Buffer.from(file.buffer),
                ...policies,
            });
        }
        catch (error) {
            this.eventService.emit('n8n-package-import-failed', {
                user: req.user,
                reason: (0, package_failure_classifier_1.classifyPackageFailure)(error),
                ...(projectId ? { projectId } : {}),
                ...(folderId ? { folderId } : {}),
            });
            throw error;
        }
    }
    async importPackageSelection(req, _res, body) {
        const { package: file, selectedProjectId, selectedWorkflowIds, deletedWorkflowIds, ...policies } = body;
        try {
            return await this.n8nPackagesService.importPackageSelection({
                user: req.user,
                apiKeyScopes: req.tokenGrant?.apiKeyScopes,
                packageBuffer: Buffer.from(file.buffer),
                ...policies,
            }, {
                selectedProjectId,
                selectedWorkflowIds,
                deletedWorkflowIds,
            });
        }
        catch (error) {
            this.eventService.emit('n8n-package-import-failed', {
                user: req.user,
                reason: (0, package_failure_classifier_1.classifyPackageFailure)(error),
            });
            throw error;
        }
    }
    async exportPackage(req, _res, body) {
        const { agentIds = [], workflowIds = [], folderIds = [], projectIds = [] } = body;
        let exportResult;
        try {
            const hasLooseSelection = [agentIds, workflowIds, folderIds].some((ids) => ids.length > 0);
            if (projectIds.length > 0 && hasLooseSelection) {
                throw new errors_1.BadRequestError('Provide either agentIds/workflowIds/folderIds or projectIds, not both');
            }
            if (!hasLooseSelection && projectIds.length === 0) {
                throw new errors_1.BadRequestError('At least one agentId, workflowId, folderId, or projectId is required');
            }
            const apiKeyScopes = assertPackageExportApiKeyScopes(req.tokenGrant?.apiKeyScopes, agentIds, workflowIds, folderIds, projectIds);
            exportResult = await this.n8nPackagesService.exportPackage({
                user: req.user,
                agentIds,
                workflowIds,
                folderIds,
                projectIds,
                includeVariableValues: body.includeVariableValues,
                canExportVariableValues: apiKeyScopes.includes('variable:list'),
                includeTags: body.includeTags,
                dependencyPolicy: body.dependencyPolicy,
                versionPolicy: body.versionPolicy,
                credentialExportPolicy: body.credentialExportPolicy,
                includeArchivedWorkflows: body.includeArchivedWorkflows,
            });
        }
        catch (error) {
            this.eventService.emit('n8n-package-export-failed', {
                user: req.user,
                reason: (0, package_failure_classifier_1.classifyPackageFailure)(error),
                ...(agentIds.length ? { agentIds } : {}),
                ...(workflowIds.length ? { workflowIds } : {}),
                ...(folderIds.length ? { folderIds } : {}),
                ...(projectIds.length ? { projectIds } : {}),
            });
            if (error instanceof package_export_errors_1.PackageEntityAccessDeniedError ||
                error instanceof package_export_errors_1.PackageEntityNotFoundError) {
                throw new n8n_workflow_1.UserError(error.message, { description: error.description });
            }
            throw error;
        }
        return {
            body: exportResult.stream,
            headers: {
                'Content-Disposition': 'attachment; filename="export.n8np"',
                [EXPORT_COUNTS_HEADER]: JSON.stringify(exportResult.counts),
                'Access-Control-Expose-Headers': EXPORT_COUNTS_HEADER,
            },
        };
    }
};
exports.N8nPackagesPublicController = N8nPackagesPublicController;
__decorate([
    (0, decorators_1.Post)('/import'),
    (0, decorators_1.ApiKeyScope)('workflow:import'),
    (0, decorators_1.ApiSummary)(n8n_packages_openapi_1.IMPORT_SUMMARY),
    (0, decorators_1.ApiDescription)(n8n_packages_openapi_1.IMPORT_DESCRIPTION),
    (0, decorators_1.ApiTags)(n8n_packages_openapi_1.PACKAGE_TAGS),
    (0, decorators_1.ApiResponse)(200, api_types_1.ImportResultDto),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(409, { dto: api_types_1.ImportBlockedErrorDto, description: n8n_packages_openapi_1.IMPORT_409_DESCRIPTION }),
    (0, decorators_1.ApiErrorResponse)(422, { dto: api_types_1.ImportBlockedErrorDto, description: n8n_packages_openapi_1.IMPORT_422_DESCRIPTION }),
    __param(2, (0, decorators_1.Body)({
        mediaType: 'multipart/form-data',
        uploadLimits: () => uploadLimits(import_package_upload_1.IMPORT_PACKAGE_MAX_PARTS),
    })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.ImportPackageRequestDto]),
    __metadata("design:returntype", Promise)
], N8nPackagesPublicController.prototype, "importPackage", null);
__decorate([
    (0, decorators_1.Post)('/import-selection'),
    (0, decorators_1.ApiKeyScope)('workflow:import'),
    (0, decorators_1.ApiSummary)(n8n_packages_openapi_1.IMPORT_SELECTION_SUMMARY),
    (0, decorators_1.ApiDescription)(n8n_packages_openapi_1.IMPORT_SELECTION_DESCRIPTION),
    (0, decorators_1.ApiTags)(n8n_packages_openapi_1.PACKAGE_TAGS),
    (0, decorators_1.ApiResponse)(200, api_types_1.ImportResultDto),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(409, {
        dto: api_types_1.ImportBlockedErrorDto,
        description: n8n_packages_openapi_1.IMPORT_SELECTION_409_DESCRIPTION,
    }),
    (0, decorators_1.ApiErrorResponse)(422, {
        dto: api_types_1.ImportBlockedErrorDto,
        description: n8n_packages_openapi_1.IMPORT_SELECTION_422_DESCRIPTION,
    }),
    __param(2, (0, decorators_1.Body)({
        mediaType: 'multipart/form-data',
        uploadLimits: () => uploadLimits(import_package_upload_1.IMPORT_PACKAGE_SELECTION_MAX_PARTS),
    })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.ImportPackageSelectionRequestDto]),
    __metadata("design:returntype", Promise)
], N8nPackagesPublicController.prototype, "importPackageSelection", null);
__decorate([
    (0, decorators_1.Post)('/export'),
    (0, decorators_1.ApiKeyScope)({ anyOf: ['project:export', 'workflow:export', 'agent:export'] }),
    (0, decorators_1.ApiSummary)(n8n_packages_openapi_1.EXPORT_SUMMARY),
    (0, decorators_1.ApiDescription)(n8n_packages_openapi_1.EXPORT_DESCRIPTION),
    (0, decorators_1.ApiTags)(n8n_packages_openapi_1.PACKAGE_TAGS),
    (0, decorators_1.ApiResponse)(200, {
        mediaType: 'application/gzip',
        description: n8n_packages_openapi_1.EXPORT_200_DESCRIPTION,
        headers: { [EXPORT_COUNTS_HEADER]: { description: n8n_packages_openapi_1.EXPORT_COUNTS_HEADER_DESCRIPTION } },
    }),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Body)({ required: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.ExportPackageRequestDto]),
    __metadata("design:returntype", Promise)
], N8nPackagesPublicController.prototype, "exportPackage", null);
exports.N8nPackagesPublicController = N8nPackagesPublicController = __decorate([
    (0, decorators_1.PublicApiController)('/n8n-packages'),
    __metadata("design:paramtypes", [n8n_packages_service_1.N8nPackagesService, backend_services_1.EventService])
], N8nPackagesPublicController);
//# sourceMappingURL=n8n-packages.public.controller.js.map