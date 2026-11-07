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
exports.ActiveWorkflowsService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const permissions_1 = require("@n8n/permissions");
const activation_errors_service_1 = require("../activation-errors.service");
const errors_1 = require("@n8n/errors");
const workflow_publication_status_service_1 = require("../workflows/publication/workflow-publication-status.service");
const workflow_finder_service_1 = require("../workflows/workflow-finder.service");
const backend_services_1 = require("@n8n/backend-services");
let ActiveWorkflowsService = class ActiveWorkflowsService {
    constructor(logger, workflowRepository, workflowSharingService, activationErrorsService, workflowFinderService, workflowsConfig, workflowPublicationStatusService) {
        this.logger = logger;
        this.workflowRepository = workflowRepository;
        this.workflowSharingService = workflowSharingService;
        this.activationErrorsService = activationErrorsService;
        this.workflowFinderService = workflowFinderService;
        this.workflowsConfig = workflowsConfig;
        this.workflowPublicationStatusService = workflowPublicationStatusService;
    }
    async getAllActiveIdsInStorage() {
        return await this.dropActivationFailures(await this.workflowRepository.getActiveIds());
    }
    async getAllActiveIdsFor(user) {
        const activeWorkflowIds = await this.workflowRepository.getActiveIds();
        const hasFullAccess = (0, permissions_1.hasGlobalScope)(user, 'workflow:read');
        if (hasFullAccess) {
            return await this.dropActivationFailures(activeWorkflowIds);
        }
        const accessibleWorkflowIds = new Set(await this.workflowSharingService.getSharedWorkflowIds(user, { scopes: ['workflow:read'] }));
        return await this.dropActivationFailures(activeWorkflowIds.filter((workflowId) => accessibleWorkflowIds.has(workflowId)));
    }
    async getActivationError(workflowId, user) {
        const workflow = await this.workflowFinderService.findWorkflowForUser(workflowId, user, [
            'workflow:read',
        ]);
        if (!workflow) {
            this.logger.warn('User attempted to access workflow errors without permissions', {
                workflowId,
                userId: user.id,
            });
            throw new errors_1.BadRequestError(`Workflow with ID "${workflowId}" could not be found.`);
        }
        if (this.workflowsConfig.useWorkflowPublicationService) {
            const publicationError = await this.workflowPublicationStatusService.getFailedActivationError(workflowId, workflow.nodes);
            if (publicationError !== null)
                return publicationError;
        }
        return await this.activationErrorsService.get(workflowId);
    }
    async dropActivationFailures(workflowIds) {
        const activationErrors = await this.activationErrorsService.getAll();
        const candidates = workflowIds.filter((workflowId) => !activationErrors[workflowId]);
        if (!this.workflowsConfig.useWorkflowPublicationService)
            return candidates;
        const statuses = await this.workflowPublicationStatusService.getListStatusesByWorkflowIds(candidates);
        return candidates.filter((workflowId) => statuses.get(workflowId) !== 'failed');
    }
};
exports.ActiveWorkflowsService = ActiveWorkflowsService;
exports.ActiveWorkflowsService = ActiveWorkflowsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, db_1.WorkflowRepository, backend_services_1.WorkflowSharingService, activation_errors_service_1.ActivationErrorsService, workflow_finder_service_1.WorkflowFinderService, config_1.WorkflowsConfig, workflow_publication_status_service_1.WorkflowPublicationStatusService])
], ActiveWorkflowsService);
//# sourceMappingURL=active-workflows.service.js.map