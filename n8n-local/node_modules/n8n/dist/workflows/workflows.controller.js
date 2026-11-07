"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowsController = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const backend_network_1 = require("@n8n/backend-network");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const permissions_1 = require("@n8n/permissions");
const typeorm_1 = require("@n8n/typeorm");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const express_1 = __importDefault(require("express"));
const n8n_workflow_1 = require("n8n-workflow");
const auth_service_1 = require("../auth/auth.service");
const errors_1 = require("@n8n/errors");
const execution_service_1 = require("../executions/execution.service");
const license_1 = require("../license");
const middlewares_1 = require("../middlewares");
const check_access_1 = require("../permissions.ee/check-access");
const ResponseHelper = __importStar(require("../response-helper"));
const naming_service_1 = require("../services/naming.service");
const ownership_service_1 = require("../services/ownership.service");
const project_service_ee_1 = require("../services/project.service.ee");
const email_1 = require("../user-management/email");
const utils = __importStar(require("../utils"));
const utils_1 = require("../workflows/utils");
const collaboration_service_1 = require("../collaboration/collaboration.service");
const workflow_publication_status_service_1 = require("./publication/workflow-publication-status.service");
const workflow_creation_service_1 = require("./workflow-creation.service");
const workflow_entity_mapper_1 = require("./workflow-entity-mapper");
const workflow_execution_service_1 = require("./workflow-execution.service");
const workflow_finder_service_1 = require("./workflow-finder.service");
const workflow_service_1 = require("./workflow.service");
const workflow_service_ee_1 = require("./workflow.service.ee");
let WorkflowsController = class WorkflowsController {
    constructor(logger, authService, enterpriseWorkflowService, namingService, workflowRepository, workflowService, workflowCreationService, workflowExecutionService, license, mailer, projectRepository, projectService, projectRelationRepository, eventService, globalConfig, workflowFinderService, executionService, collaborationService, outboundHttp, workflowPublicationStatusService, ownershipService) {
        this.logger = logger;
        this.authService = authService;
        this.enterpriseWorkflowService = enterpriseWorkflowService;
        this.namingService = namingService;
        this.workflowRepository = workflowRepository;
        this.workflowService = workflowService;
        this.workflowCreationService = workflowCreationService;
        this.workflowExecutionService = workflowExecutionService;
        this.license = license;
        this.mailer = mailer;
        this.projectRepository = projectRepository;
        this.projectService = projectService;
        this.projectRelationRepository = projectRelationRepository;
        this.eventService = eventService;
        this.globalConfig = globalConfig;
        this.workflowFinderService = workflowFinderService;
        this.executionService = executionService;
        this.collaborationService = collaborationService;
        this.outboundHttp = outboundHttp;
        this.workflowPublicationStatusService = workflowPublicationStatusService;
        this.ownershipService = ownershipService;
    }
    async create(req, _res, body) {
        if (body.id) {
            const workflowExists = await this.workflowRepository.existsBy({ id: body.id });
            if (workflowExists) {
                throw new errors_1.BadRequestError(`Workflow with id ${body.id} exists already.`);
            }
        }
        const newWorkflow = (0, workflow_entity_mapper_1.createWorkflowEntityFromPayload)(body);
        const savedWorkflow = await this.workflowCreationService.createWorkflow(req.user, newWorkflow, {
            tagIds: body.tags,
            parentFolderId: body.parentFolderId,
            projectId: body.projectId,
            autosaved: body.autosaved,
            uiContext: body.uiContext,
        });
        const savedWorkflowWithMetaData = this.enterpriseWorkflowService.addOwnerAndSharings(savedWorkflow);
        delete savedWorkflowWithMetaData.shared;
        const scopes = await this.workflowService.getWorkflowScopes(req.user, savedWorkflow.id);
        const checksum = await (0, n8n_workflow_1.calculateWorkflowChecksum)(savedWorkflow);
        return { ...savedWorkflowWithMetaData, scopes, checksum };
    }
    async getAll(req, res) {
        try {
            const userCanListProjectFolders = req.listQueryOptions?.filter?.projectId
                ? await (0, check_access_1.userHasScopes)(req.user, ['folder:list'], false, {
                    projectId: req.listQueryOptions?.filter?.projectId,
                })
                : true;
            const { workflows: data, count } = await this.workflowService.getMany(req.user, req.listQueryOptions, {
                includeScopes: !!req.query.includeScopes,
                includeFolders: userCanListProjectFolders && !!req.query.includeFolders,
                onlySharedWithMe: !!req.query.onlySharedWithMe,
                includePublicationStatus: true,
            });
            res.json({ count, data });
        }
        catch (maybeError) {
            const error = utils.toError(maybeError);
            ResponseHelper.reportError(error);
            ResponseHelper.sendErrorResponse(res, error);
        }
    }
    async getNewName(req) {
        const projectId = req.query.projectId;
        if (!(await this.projectService.getProjectWithScope(req.user, projectId, ['workflow:create']))) {
            throw new errors_1.ForbiddenError("You don't have the permissions to create a workflow in this project.");
        }
        const requestedName = req.query.name ?? this.globalConfig.workflows.defaultName;
        const name = await this.namingService.getUniqueWorkflowName(requestedName);
        return { name };
    }
    async getFromUrl(req, _res, query) {
        const projectId = query.projectId;
        if (!(await this.projectService.getProjectWithScope(req.user, projectId, ['workflow:create']))) {
            throw new errors_1.ForbiddenError("You don't have the permissions to create a workflow in this project.");
        }
        const workflowData = await this.fetchWorkflowFromUrl(query.url);
        if (workflowData?.nodes === undefined ||
            !Array.isArray(workflowData.nodes) ||
            workflowData.connections === undefined ||
            typeof workflowData.connections !== 'object' ||
            Array.isArray(workflowData.connections)) {
            throw new errors_1.BadRequestError('The data in the file does not seem to be a n8n workflow JSON file!');
        }
        return workflowData;
    }
    async getWorkflow(req) {
        const { workflowId } = req.params;
        if (this.license.isSharingEnabled()) {
            const relations = {
                shared: {
                    project: {
                        projectRelations: true,
                    },
                },
            };
            if (!this.globalConfig.tags.disabled) {
                relations.tags = true;
            }
            const workflow = await this.workflowFinderService.findWorkflowForUser(workflowId, req.user, ['workflow:read'], {
                includeTags: !this.globalConfig.tags.disabled,
                includeParentFolder: true,
                includeActiveVersion: true,
                publishHistory: 'latestActivation',
            });
            if (!workflow) {
                throw new errors_1.NotFoundError(`Workflow with ID "${workflowId}" does not exist`);
            }
            const enterpriseWorkflowService = this.enterpriseWorkflowService;
            const workflowWithMetaData = enterpriseWorkflowService.addOwnerAndSharings(workflow);
            await enterpriseWorkflowService.addCredentialsToWorkflow(workflowWithMetaData, req.user);
            delete workflowWithMetaData.shared;
            const scopes = await this.workflowService.getWorkflowScopes(req.user, workflowId);
            const checksum = await (0, n8n_workflow_1.calculateWorkflowChecksum)(workflow);
            return { ...workflowWithMetaData, scopes, checksum };
        }
        const workflow = await this.workflowFinderService.findWorkflowForUser(workflowId, req.user, ['workflow:read'], {
            includeTags: !this.globalConfig.tags.disabled,
            includeParentFolder: true,
            includeActiveVersion: true,
            publishHistory: 'latestActivation',
        });
        if (!workflow) {
            this.logger.warn('User attempted to access a workflow without permissions', {
                workflowId,
                userId: req.user.id,
            });
            throw new errors_1.NotFoundError('Could not load the workflow - you can only access workflows owned by you');
        }
        const scopes = await this.workflowService.getWorkflowScopes(req.user, workflowId);
        const checksum = await (0, n8n_workflow_1.calculateWorkflowChecksum)(workflow);
        return { ...workflow, scopes, checksum };
    }
    async exists(req) {
        const exists = await this.workflowRepository.existsBy({ id: req.params.workflowId });
        return { exists };
    }
    async update(req, _res, workflowId, body) {
        const forceSave = req.query.forceSave === 'true';
        const clientId = req.headers['push-ref'];
        await this.collaborationService.validateWriteLock(req.user.id, clientId, workflowId, 'update');
        const { tags, parentFolderId, aiBuilderAssisted, expectedChecksum, autosaved, restoredFromVersionId, ...rest } = body;
        if (body.settings?.timeSavedMode !== undefined &&
            !['fixed', 'dynamic'].includes(body.settings.timeSavedMode)) {
            throw new errors_1.BadRequestError('Invalid timeSavedMode');
        }
        const updateData = (0, workflow_entity_mapper_1.createWorkflowEntityFromPayload)(rest);
        const isSharingEnabled = this.license.isSharingEnabled();
        const updatedWorkflow = await this.workflowService.update(req.user, updateData, workflowId, {
            tagIds: tags,
            parentFolderId,
            forceSave: isSharingEnabled ? forceSave : true,
            expectedChecksum,
            aiBuilderAssisted,
            autosaved,
            restoredFromVersionId,
        });
        const scopes = await this.workflowService.getWorkflowScopes(req.user, workflowId);
        const checksum = await (0, n8n_workflow_1.calculateWorkflowChecksum)(updatedWorkflow);
        await this.collaborationService.broadcastWorkflowUpdate(workflowId, req.user.id);
        return { ...updatedWorkflow, scopes, checksum };
    }
    async getWriteLock(req, _res, workflowId) {
        const writeLock = await this.collaborationService.getWriteLock(req.user.id, workflowId);
        return writeLock;
    }
    async delete(req, _res, workflowId) {
        const clientId = req.headers['push-ref'];
        await this.collaborationService.validateWriteLock(req.user.id, clientId, workflowId, 'delete');
        const workflow = await this.workflowService.delete(req.user, workflowId);
        if (!workflow) {
            this.logger.warn('User attempted to delete a workflow without permissions', {
                workflowId,
                userId: req.user.id,
            });
            throw new errors_1.ForbiddenError('Could not delete the workflow - workflow was not found in your projects');
        }
        return true;
    }
    async archive(req, _res, workflowId, body) {
        const clientId = req.headers['push-ref'];
        await this.collaborationService.validateWriteLock(req.user.id, clientId, workflowId, 'archive');
        const { expectedChecksum } = body;
        const workflow = await this.workflowService.archive(req.user, workflowId, {
            expectedChecksum,
        });
        if (!workflow) {
            this.logger.warn('User attempted to archive a workflow without permissions', {
                workflowId,
                userId: req.user.id,
            });
            throw new errors_1.ForbiddenError('Could not archive the workflow - workflow was not found in your projects');
        }
        const checksum = await (0, n8n_workflow_1.calculateWorkflowChecksum)(workflow);
        await this.collaborationService.broadcastWorkflowUpdate(workflowId, req.user.id);
        return { ...workflow, checksum };
    }
    async unarchive(req, _res, workflowId) {
        const clientId = req.headers['push-ref'];
        await this.collaborationService.validateWriteLock(req.user.id, clientId, workflowId, 'unarchive');
        const workflow = await this.workflowService.unarchive(req.user, workflowId);
        if (!workflow) {
            this.logger.warn('User attempted to unarchive a workflow without permissions', {
                workflowId,
                userId: req.user.id,
            });
            throw new errors_1.ForbiddenError('Could not unarchive the workflow - workflow was not found in your projects');
        }
        const checksum = await (0, n8n_workflow_1.calculateWorkflowChecksum)(workflow);
        await this.collaborationService.broadcastWorkflowUpdate(workflowId, req.user.id);
        return { ...workflow, checksum };
    }
    async activate(req, _res, workflowId, body) {
        const clientId = req.headers['push-ref'];
        await this.collaborationService.validateWriteLock(req.user.id, clientId, workflowId, 'activate');
        const { versionId, name, description, expectedChecksum } = body;
        const workflow = await this.workflowService.activateWorkflow(req.user, workflowId, {
            versionId,
            name,
            description,
            expectedChecksum,
            publishHistory: 'latestActivation',
        });
        const scopes = await this.workflowService.getWorkflowScopes(req.user, workflowId);
        const checksum = await (0, n8n_workflow_1.calculateWorkflowChecksum)(workflow);
        await this.collaborationService.broadcastWorkflowUpdate(workflowId, req.user.id);
        return { ...workflow, scopes, checksum };
    }
    async deactivate(req, _res, workflowId, body) {
        const clientId = req.headers['push-ref'];
        await this.collaborationService.validateWriteLock(req.user.id, clientId, workflowId, 'deactivate');
        const { expectedChecksum } = body;
        const workflow = await this.workflowService.deactivateWorkflow(req.user, workflowId, {
            expectedChecksum,
        });
        const scopes = await this.workflowService.getWorkflowScopes(req.user, workflowId);
        const checksum = await (0, n8n_workflow_1.calculateWorkflowChecksum)(workflow);
        await this.collaborationService.broadcastWorkflowUpdate(workflowId, req.user.id);
        return { ...workflow, scopes, checksum };
    }
    async runManually(req) {
        const parseResult = api_types_1.ManualRunDto.safeParse(req.body);
        if (!parseResult.success) {
            throw new errors_1.BadRequestError(parseResult.error.errors[0].message);
        }
        const body = parseResult.data;
        const workflowId = req.params.workflowId;
        const dbWorkflow = await this.workflowRepository.get({ id: workflowId });
        if (!dbWorkflow) {
            throw new errors_1.NotFoundError(`Workflow with ID "${workflowId}" not found`);
        }
        const n8nAuthCookie = this.authService.getCookieToken(req);
        const result = await this.workflowExecutionService.executeManually(dbWorkflow, body, req.user, req.headers['push-ref'], n8nAuthCookie);
        if ('executionId' in result) {
            const { projectId, projectName } = await (0, utils_1.getWorkflowProjectDetailsSafe)(this.ownershipService, dbWorkflow.id);
            this.eventService.emit('workflow-executed', {
                user: {
                    id: req.user.id,
                    email: req.user.email,
                    firstName: req.user.firstName,
                    lastName: req.user.lastName,
                    role: req.user.role,
                },
                workflowId: dbWorkflow.id,
                workflowName: dbWorkflow.name,
                executionId: result.executionId,
                projectId,
                projectName,
                source: 'user-manual',
            });
        }
        return result;
    }
    async share(req) {
        const { workflowId } = req.params;
        const { shareWithIds } = req.body;
        if (!Array.isArray(shareWithIds) ||
            !shareWithIds.every((userId) => typeof userId === 'string')) {
            throw new errors_1.BadRequestError('Bad request');
        }
        const workflow = await this.workflowFinderService.findWorkflowForUser(workflowId, req.user, [
            'workflow:read',
        ]);
        if (!workflow) {
            throw new errors_1.ForbiddenError();
        }
        const currentPersonalProjectIDs = workflow.shared
            .filter((sw) => sw.role === 'workflow:editor')
            .map((sw) => sw.projectId);
        const newPersonalProjectIDs = shareWithIds;
        const toShare = utils.rightDiff([currentPersonalProjectIDs, (id) => id], [newPersonalProjectIDs, (id) => id]);
        const toUnshare = utils.rightDiff([newPersonalProjectIDs, (id) => id], [currentPersonalProjectIDs, (id) => id]);
        if (toShare.length > 0) {
            const canShare = await (0, check_access_1.userHasScopes)(req.user, ['workflow:share'], false, { workflowId });
            if (!canShare) {
                throw new errors_1.ForbiddenError();
            }
        }
        if (toUnshare.length > 0) {
            const canUnshare = await (0, check_access_1.userHasScopes)(req.user, ['workflow:unshare'], false, {
                workflowId,
            });
            if (!canUnshare) {
                throw new errors_1.ForbiddenError();
            }
        }
        let newShareeIds = [];
        const { manager: dbManager } = this.projectRepository;
        await dbManager.transaction(async (trx) => {
            await trx.delete(db_1.SharedWorkflow, {
                workflowId,
                projectId: (0, typeorm_1.In)(toUnshare),
            });
            await this.enterpriseWorkflowService.shareWithProjects(workflow.id, toShare, trx);
            newShareeIds = toShare;
        });
        this.eventService.emit('workflow-sharing-updated', {
            workflowId,
            userIdSharer: req.user.id,
            userIdList: shareWithIds,
        });
        const projectsRelations = await this.projectRelationRepository.findBy({
            projectId: (0, typeorm_1.In)(newShareeIds),
            role: { slug: permissions_1.PROJECT_OWNER_ROLE_SLUG },
        });
        await this.mailer.notifyWorkflowShared({
            sharer: req.user,
            newShareeIds: projectsRelations.map((pr) => pr.userId),
            workflow,
        });
    }
    async transfer(req, _res, workflowId, body) {
        return await this.enterpriseWorkflowService.transferWorkflow(req.user, workflowId, body.destinationProjectId, body.shareCredentials, body.destinationParentFolderId);
    }
    async getLastSuccessfulExecution(req, _res, workflowId) {
        const redactQuery = api_types_1.ExecutionRedactionQueryDtoSchema.safeParse(req.query);
        const redactExecutionData = redactQuery.success
            ? redactQuery.data.redactExecutionData
            : undefined;
        const lastExecution = await this.executionService.getLastSuccessfulExecution(workflowId, req.user, redactExecutionData);
        return lastExecution ?? null;
    }
    async getPublicationStatus(req, _res, workflowId) {
        if (!this.globalConfig.workflows.useWorkflowPublicationService) {
            throw new errors_1.NotFoundError('Workflow publication status is not available');
        }
        const workflow = await this.workflowFinderService.findWorkflowForUser(workflowId, req.user, [
            'workflow:read',
        ]);
        if (!workflow) {
            throw new errors_1.NotFoundError(`Workflow with ID "${workflowId}" does not exist`);
        }
        return await this.workflowPublicationStatusService.getStatus(workflowId);
    }
    async getCallableSubworkflows(req, _res, workflowId, query) {
        return await this.workflowService.getCallableSubworkflows(req.user, workflowId, query);
    }
    async getWorkflowsWithNodesIncluded(req, res) {
        try {
            const hasPermission = (0, permissions_1.hasGlobalScope)(req.user, ['workflow:read']);
            if (!hasPermission) {
                res.json({ data: [], count: 0 });
                return;
            }
            const { nodeTypes } = req.body;
            const workflows = await this.workflowService.getWorkflowsWithNodesIncluded(req.user, nodeTypes);
            res.json({
                data: workflows,
                count: workflows.length,
            });
        }
        catch (maybeError) {
            const error = utils.toError(maybeError);
            ResponseHelper.reportError(error);
            ResponseHelper.sendErrorResponse(res, error);
        }
    }
    async fetchWorkflowFromUrl(url) {
        const client = this.outboundHttp.requests();
        try {
            return await client.request({ method: 'GET', url });
        }
        catch (error) {
            const blockedError = this.findSsrfBlockedError(error);
            if (blockedError)
                throw blockedError;
            throw new errors_1.BadRequestError('The URL does not point to valid JSON file!');
        }
    }
    findSsrfBlockedError(error) {
        let current = (0, ensure_error_1.ensureError)(error);
        for (let depth = 0; depth < 4 && current; depth++) {
            if (current instanceof backend_network_1.SsrfBlockedIpError)
                return current;
            current = (0, ensure_error_1.ensureError)(current.cause);
        }
        return undefined;
    }
};
exports.WorkflowsController = WorkflowsController;
__decorate([
    (0, decorators_1.Post)('/'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.CreateWorkflowDto]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "create", null);
__decorate([
    (0, decorators_1.Get)('/', { middlewares: middlewares_1.listQueryMiddleware }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "getAll", null);
__decorate([
    (0, decorators_1.Get)('/new'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "getNewName", null);
__decorate([
    (0, decorators_1.Get)('/from-url'),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.ImportWorkflowFromUrlDto]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "getFromUrl", null);
__decorate([
    (0, decorators_1.Get)('/:workflowId'),
    (0, decorators_1.ProjectScope)('workflow:read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "getWorkflow", null);
__decorate([
    (0, decorators_1.Get)('/:workflowId/exists'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "exists", null);
__decorate([
    (0, decorators_1.Patch)('/:workflowId'),
    (0, decorators_1.ProjectScope)('workflow:update'),
    __param(2, (0, decorators_1.Param)('workflowId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.UpdateWorkflowDto]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "update", null);
__decorate([
    (0, decorators_1.Get)('/:workflowId/collaboration/write-lock'),
    (0, decorators_1.ProjectScope)('workflow:read'),
    __param(2, (0, decorators_1.Param)('workflowId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Response, String]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "getWriteLock", null);
__decorate([
    (0, decorators_1.Delete)('/:workflowId'),
    (0, decorators_1.ProjectScope)('workflow:delete'),
    __param(2, (0, decorators_1.Param)('workflowId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Response, String]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "delete", null);
__decorate([
    (0, decorators_1.Post)('/:workflowId/archive'),
    (0, decorators_1.ProjectScope)('workflow:delete'),
    __param(2, (0, decorators_1.Param)('workflowId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Response, String, api_types_1.ArchiveWorkflowDto]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "archive", null);
__decorate([
    (0, decorators_1.Post)('/:workflowId/unarchive'),
    (0, decorators_1.ProjectScope)('workflow:delete'),
    __param(2, (0, decorators_1.Param)('workflowId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Response, String]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "unarchive", null);
__decorate([
    (0, decorators_1.Post)('/:workflowId/activate'),
    (0, decorators_1.ProjectScope)('workflow:publish'),
    __param(2, (0, decorators_1.Param)('workflowId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.ActivateWorkflowDto]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "activate", null);
__decorate([
    (0, decorators_1.Post)('/:workflowId/deactivate'),
    (0, decorators_1.ProjectScope)('workflow:unpublish'),
    __param(2, (0, decorators_1.Param)('workflowId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.DeactivateWorkflowDto]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "deactivate", null);
__decorate([
    (0, decorators_1.Post)('/:workflowId/run'),
    (0, decorators_1.ProjectScope)('workflow:execute'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "runManually", null);
__decorate([
    (0, decorators_1.Licensed)('feat:sharing'),
    (0, decorators_1.Put)('/:workflowId/share'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "share", null);
__decorate([
    (0, decorators_1.Put)('/:workflowId/transfer'),
    (0, decorators_1.ProjectScope)('workflow:move'),
    __param(2, (0, decorators_1.Param)('workflowId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.TransferWorkflowBodyDto]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "transfer", null);
__decorate([
    (0, decorators_1.Get)('/:workflowId/executions/last-successful'),
    (0, decorators_1.ProjectScope)('workflow:read'),
    __param(2, (0, decorators_1.Param)('workflowId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "getLastSuccessfulExecution", null);
__decorate([
    (0, decorators_1.Get)('/:workflowId/publication-status'),
    (0, decorators_1.ProjectScope)('workflow:read'),
    __param(2, (0, decorators_1.Param)('workflowId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "getPublicationStatus", null);
__decorate([
    (0, decorators_1.Get)('/:workflowId/callable-subworkflows'),
    (0, decorators_1.ProjectScope)('workflow:update'),
    __param(2, (0, decorators_1.Param)('workflowId')),
    __param(3, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.ListCallableSubworkflowsQueryDto]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "getCallableSubworkflows", null);
__decorate([
    (0, decorators_1.Post)('/with-node-types'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "getWorkflowsWithNodesIncluded", null);
exports.WorkflowsController = WorkflowsController = __decorate([
    (0, decorators_1.RestController)('/workflows'),
    __metadata("design:paramtypes", [backend_common_1.Logger, auth_service_1.AuthService, workflow_service_ee_1.EnterpriseWorkflowService, naming_service_1.NamingService, db_1.WorkflowRepository, workflow_service_1.WorkflowService, workflow_creation_service_1.WorkflowCreationService, workflow_execution_service_1.WorkflowExecutionService, license_1.License, email_1.UserManagementMailer, db_1.ProjectRepository, project_service_ee_1.ProjectService, db_1.ProjectRelationRepository, backend_services_1.EventService, config_1.GlobalConfig, workflow_finder_service_1.WorkflowFinderService, execution_service_1.ExecutionService, collaboration_service_1.CollaborationService, backend_network_1.OutboundHttp, workflow_publication_status_service_1.WorkflowPublicationStatusService, ownership_service_1.OwnershipService])
], WorkflowsController);
//# sourceMappingURL=workflows.controller.js.map