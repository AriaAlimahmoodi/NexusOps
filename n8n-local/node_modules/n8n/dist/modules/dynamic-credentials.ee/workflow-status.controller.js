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
exports.WorkflowStatusController = void 0;
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
const backend_services_1 = require("@n8n/backend-services");
const workflow_finder_service_1 = require("../../workflows/workflow-finder.service");
const dynamic_credentials_config_1 = require("./dynamic-credentials.config");
const credential_resolver_workflow_service_1 = require("./services/credential-resolver-workflow.service");
const dynamic_credential_cors_service_1 = require("./services/dynamic-credential-cors.service");
const dynamic_credential_web_service_1 = require("./services/dynamic-credential-web.service");
const utils_1 = require("./utils");
const dynamicCredentialsConfig = di_1.Container.get(dynamic_credentials_config_1.DynamicCredentialsConfig);
let WorkflowStatusController = class WorkflowStatusController {
    constructor(credentialResolverWorkflowService, urlService, globalConfig, dynamicCredentialCorsService, dynamicCredentialWebService, workflowFinderService) {
        this.credentialResolverWorkflowService = credentialResolverWorkflowService;
        this.urlService = urlService;
        this.globalConfig = globalConfig;
        this.dynamicCredentialCorsService = dynamicCredentialCorsService;
        this.dynamicCredentialWebService = dynamicCredentialWebService;
        this.workflowFinderService = workflowFinderService;
    }
    handlePreflightExecutionStatus(req, res) {
        this.dynamicCredentialCorsService.preflightHandler(req, res, ['get', 'options']);
    }
    async checkWorkflowForExecution(req, res) {
        this.dynamicCredentialCorsService.applyCorsHeadersIfEnabled(req, res, ['get', 'options']);
        const workflowId = req.params['workflowId'];
        const credentialContext = this.dynamicCredentialWebService.getCredentialContextFromRequest(req);
        if (!workflowId) {
            throw new errors_1.BadRequestError('Workflow ID is missing');
        }
        const user = (0, db_1.isAuthenticatedRequest)(req) ? req.user : undefined;
        if (user) {
            const workflow = await this.workflowFinderService.findWorkflowForUser(workflowId, user, [
                'workflow:read',
            ]);
            if (!workflow) {
                throw new errors_1.NotFoundError('Workflow not found');
            }
        }
        const status = await this.credentialResolverWorkflowService.getWorkflowStatus(workflowId, credentialContext, { user });
        const isReady = status.every((s) => s.status === 'configured');
        const basePath = this.urlService.getInstanceBaseUrl();
        const restPath = this.globalConfig.endpoints.rest;
        const executionStatus = {
            workflowId,
            readyToExecute: isReady,
            credentials: status.map((s) => ({
                credentialId: s.credentialId,
                credentialName: s.credentialName,
                credentialStatus: s.status,
                credentialType: s.credentialType,
                ...(s.resolverId
                    ? {
                        authorizationUrl: `${basePath}/${restPath}/credentials/${s.credentialId}/authorize?resolverId=${encodeURIComponent(s.resolverId)}`,
                        revokeUrl: `${basePath}/${restPath}/credentials/${s.credentialId}/revoke?resolverId=${encodeURIComponent(s.resolverId)}`,
                    }
                    : {}),
            })),
        };
        return executionStatus;
    }
};
exports.WorkflowStatusController = WorkflowStatusController;
__decorate([
    (0, decorators_1.Options)('/:workflowId/execution-status', { skipAuth: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], WorkflowStatusController.prototype, "handlePreflightExecutionStatus", null);
__decorate([
    (0, decorators_1.Get)('/:workflowId/execution-status', {
        allowUnauthenticated: true,
        middlewares: (0, utils_1.getDynamicCredentialMiddlewares)(),
        ipRateLimit: {
            limit: dynamicCredentialsConfig.rateLimitPerMinute,
            windowMs: 1 * constants_1.Time.minutes.toMilliseconds,
        },
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WorkflowStatusController.prototype, "checkWorkflowForExecution", null);
exports.WorkflowStatusController = WorkflowStatusController = __decorate([
    (0, decorators_1.RestController)('/workflows'),
    __metadata("design:paramtypes", [credential_resolver_workflow_service_1.CredentialResolverWorkflowService, backend_services_1.UrlService, config_1.GlobalConfig, dynamic_credential_cors_service_1.DynamicCredentialCorsService, dynamic_credential_web_service_1.DynamicCredentialWebService, workflow_finder_service_1.WorkflowFinderService])
], WorkflowStatusController);
//# sourceMappingURL=workflow-status.controller.js.map