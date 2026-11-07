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
exports.WorkflowsPublicController = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const decorators_1 = require("@n8n/decorators");
const n8n_workflow_1 = require("n8n-workflow");
const folder_not_found_error_1 = require("../../../errors/folder-not-found.error");
const errors_1 = require("@n8n/errors");
const shared_workflow_not_found_error_1 = require("../../../errors/shared-workflow-not-found.error");
const workflow_history_version_not_found_error_1 = require("../../../errors/workflow-history-version-not-found.error");
const redaction_enforcement_service_1 = require("../../../modules/redaction/redaction-enforcement.service");
const policy_violation_error_1 = require("../../../policy/policy-violation.error");
const project_mapper_1 = require("../../../public-api/v1/shared/project.mapper");
const pagination_service_1 = require("../../../public-api/v1/shared/services/pagination.service");
const tag_service_1 = require("../../../services/tag.service");
const workflow_creation_service_1 = require("../../../workflows/workflow-creation.service");
const workflow_entity_mapper_1 = require("../../../workflows/workflow-entity-mapper");
const workflow_finder_service_1 = require("../../../workflows/workflow-finder.service");
const workflow_history_service_1 = require("../../../workflows/workflow-history/workflow-history.service");
const workflow_service_1 = require("../../../workflows/workflow.service");
const workflow_service_ee_1 = require("../../../workflows/workflow.service.ee");
const ACTIVATE_DEACTIVATE_DEPRECATED_SINCE = new Date('2026-07-23T00:00:00Z');
const OLD_VERSION_PATH_DEPRECATED_SINCE = new Date('2026-08-26T00:00:00Z');
const UPDATE_CONFLICT_DESCRIPTION = 'Conflict, e.g. re-publication blocked by an open workflow review (then `reason` and ' +
    '`workflowReviewRequestId` are present; the update itself is still saved as a draft) or a ' +
    'webhook path conflict.';
const UPDATE_PUBLISH_FORBIDDEN_DESCRIPTION = 'The update would re-publish the workflow, but the API key lacks `workflow:activate` or the ' +
    'caller lacks `workflow:publish` on the project. The update is still saved as a draft, named ' +
    'by `versionId`, and the published version stays live.';
const PUBLISH_CONFLICT_DESCRIPTION = 'Conflict, e.g. publication blocked by an open workflow review (then `reason` and ' +
    '`workflowReviewRequestId` are present) or a webhook path conflict.';
function toPublicJson(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
        ? value
        : null;
}
function parseTagNames(tags) {
    return tags.split(',').map((tag) => tag.trim());
}
function toPublicTag(tag) {
    return {
        id: tag.id,
        name: tag.name,
        createdAt: tag.createdAt.toISOString(),
        updatedAt: tag.updatedAt.toISOString(),
    };
}
function toPublicFolder(folder) {
    return {
        id: folder.id,
        name: folder.name,
        parentFolderId: folder.parentFolderId,
        createdAt: folder.createdAt.toISOString(),
        updatedAt: folder.updatedAt.toISOString(),
    };
}
function toPublicParentFolderRef(folder) {
    return folder ? { id: folder.id } : null;
}
function toPublicSharedWorkflow(sharedWorkflow) {
    return {
        role: sharedWorkflow.role,
        workflowId: sharedWorkflow.workflowId,
        projectId: sharedWorkflow.projectId,
        project: (0, project_mapper_1.toPublicProject)(sharedWorkflow.project),
        createdAt: sharedWorkflow.createdAt.toISOString(),
        updatedAt: sharedWorkflow.updatedAt.toISOString(),
    };
}
function toPublicListSharedWorkflow(sharedWorkflow) {
    return {
        role: sharedWorkflow.role,
        workflowId: sharedWorkflow.workflowId,
        projectId: sharedWorkflow.projectId,
        createdAt: sharedWorkflow.createdAt.toISOString(),
        updatedAt: sharedWorkflow.updatedAt.toISOString(),
    };
}
function toPublicActiveVersionWithoutHistory(activeVersion) {
    return {
        versionId: activeVersion.versionId,
        workflowId: activeVersion.workflowId,
        nodes: activeVersion.nodes,
        connections: activeVersion.connections,
        nodeGroups: activeVersion.nodeGroups,
        authors: activeVersion.authors,
        name: activeVersion.name,
        description: activeVersion.description,
        autosaved: activeVersion.autosaved,
        createdAt: activeVersion.createdAt.toISOString(),
        updatedAt: activeVersion.updatedAt.toISOString(),
    };
}
function toPublicWorkflowVersion(version) {
    return {
        versionId: version.versionId,
        workflowId: version.workflowId,
        nodes: version.nodes,
        connections: version.connections,
        nodeGroups: version.nodeGroups,
        authors: version.authors,
        name: version.name,
        description: version.description,
        createdAt: version.createdAt.toISOString(),
        updatedAt: version.updatedAt.toISOString(),
    };
}
function toPublicWorkflowPublishHistory(entry) {
    return {
        id: entry.id,
        workflowId: entry.workflowId,
        versionId: entry.versionId,
        event: entry.event,
        userId: entry.userId,
        createdAt: entry.createdAt.toISOString(),
    };
}
function toPublicActiveVersion(activeVersion) {
    return {
        ...toPublicActiveVersionWithoutHistory(activeVersion),
        workflowPublishHistory: activeVersion.workflowPublishHistory.map(toPublicWorkflowPublishHistory),
    };
}
function toPublicUpdatedActiveVersion(activeVersion) {
    return activeVersion.workflowPublishHistory
        ? toPublicActiveVersion(activeVersion)
        : toPublicActiveVersionWithoutHistory(activeVersion);
}
let WorkflowsPublicController = class WorkflowsPublicController {
    constructor(workflowHistoryService, workflowFinderService, workflowCreationService, workflowService, enterpriseWorkflowService, eventService, globalConfig, tagService, redactionEnforcementService) {
        this.workflowHistoryService = workflowHistoryService;
        this.workflowFinderService = workflowFinderService;
        this.workflowCreationService = workflowCreationService;
        this.workflowService = workflowService;
        this.enterpriseWorkflowService = enterpriseWorkflowService;
        this.eventService = eventService;
        this.globalConfig = globalConfig;
        this.tagService = tagService;
        this.redactionEnforcementService = redactionEnforcementService;
    }
    get workflowTagsEnabled() {
        return !this.globalConfig.tags.disabled;
    }
    assertWorkflowTagsEnabled() {
        if (!this.workflowTagsEnabled) {
            throw new errors_1.BadRequestError('Workflow Tags Disabled');
        }
    }
    async getWorkflows(req, _res, query) {
        let { offset, limit } = query;
        if (query.cursor) {
            try {
                const decoded = (0, pagination_service_1.decodeCursor)(query.cursor);
                if ('offset' in decoded) {
                    offset = decoded.offset;
                }
                limit = decoded.limit ?? limit;
            }
            catch {
                throw new errors_1.BadRequestError('An invalid cursor was provided');
            }
        }
        const { workflows, count } = await this.workflowFinderService.findWorkflowsForUser(req.user, ['workflow:read'], {
            filters: {
                name: query.name,
                active: query.active,
                tagNames: query.tags ? parseTagNames(query.tags) : undefined,
                projectId: query.projectId,
            },
            offset,
            limit,
            includePinnedData: !query.excludePinnedData,
            includeTags: this.workflowTagsEnabled,
            includeActiveVersion: true,
            includeParentFolder: query.includeParentFolder,
        });
        this.eventService.emit('user-retrieved-all-workflows', {
            userId: req.user.id,
            publicApi: true,
        });
        return {
            data: workflows.map((workflow) => ({
                id: workflow.id,
                name: workflow.name,
                active: workflow.active,
                activeVersionId: workflow.activeVersionId,
                createdAt: workflow.createdAt.toISOString(),
                updatedAt: workflow.updatedAt.toISOString(),
                isArchived: workflow.isArchived,
                versionId: workflow.versionId,
                triggerCount: workflow.triggerCount,
                nodes: workflow.nodes,
                connections: workflow.connections,
                nodeGroups: workflow.nodeGroups,
                settings: toPublicJson(workflow.settings),
                staticData: toPublicJson(workflow.staticData),
                meta: toPublicJson(workflow.meta),
                ...(query.excludePinnedData ? {} : { pinData: toPublicJson(workflow.pinData) }),
                ...(workflow.tags ? { tags: workflow.tags.map(toPublicTag) } : {}),
                shared: workflow.shared.map(toPublicListSharedWorkflow),
                ...(query.includeParentFolder
                    ? { parentFolder: toPublicParentFolderRef(workflow.parentFolder) }
                    : {}),
                activeVersion: workflow.activeVersion
                    ? toPublicActiveVersionWithoutHistory(workflow.activeVersion)
                    : null,
            })),
            nextCursor: (0, pagination_service_1.encodeNextCursor)({ offset, limit, numberOfTotalRecords: count }),
        };
    }
    async createWorkflow(req, _res, body) {
        const { projectId, parentFolderId, shared: _shared, ...rest } = body;
        const workflow = (0, workflow_entity_mapper_1.createWorkflowEntityFromPayload)(rest);
        await this.redactionEnforcementService.assertNewPolicyAllowed(body.settings.redactionPolicy);
        const createdWorkflow = await this.workflowCreationService.createWorkflow(req.user, workflow, {
            projectId,
            parentFolderId: parentFolderId ?? undefined,
            publicApi: true,
            source: 'api',
        });
        return {
            ...this.toWorkflowPublicDto(createdWorkflow),
            parentFolder: createdWorkflow.parentFolder
                ? toPublicFolder(createdWorkflow.parentFolder)
                : null,
        };
    }
    async getWorkflow(req, _res, workflowId, query) {
        const workflow = await this.workflowFinderService.findWorkflowForUser(workflowId, req.user, ['workflow:read'], {
            includeTags: this.workflowTagsEnabled,
            includeActiveVersion: true,
            includeParentFolder: true,
        });
        if (!workflow) {
            throw new errors_1.NotFoundError('Not Found');
        }
        this.eventService.emit('user-retrieved-workflow', {
            userId: req.user.id,
            publicApi: true,
        });
        return {
            ...this.toWorkflowPublicDto(workflow, { excludePinnedData: query.excludePinnedData }),
            parentFolder: workflow.parentFolder ? toPublicFolder(workflow.parentFolder) : null,
        };
    }
    async updateWorkflow(req, _res, workflowId, body, query) {
        const { parentFolderId, shared: _shared, ...rest } = body;
        const resolvedParentFolderId = parentFolderId === null ? n8n_workflow_1.PROJECT_ROOT : parentFolderId;
        let updatedWorkflow;
        try {
            updatedWorkflow = await this.workflowService.update(req.user, (0, workflow_entity_mapper_1.createWorkflowEntityFromPayload)(rest), workflowId, {
                parentFolderId: resolvedParentFolderId,
                forceSave: true,
                publicApi: true,
                publishIfActive: query.publishIfActive,
                apiKeyScopes: req.tokenGrant?.apiKeyScopes ?? [],
                source: 'api',
            });
        }
        catch (error) {
            if (error instanceof folder_not_found_error_1.FolderNotFoundError)
                throw new errors_1.NotFoundError(error.message);
            if (error instanceof errors_1.ResponseError)
                throw error;
            if (error instanceof policy_violation_error_1.PolicyViolationError)
                throw error;
            if (error instanceof Error)
                throw new errors_1.BadRequestError(error.message);
            throw error;
        }
        return this.toUpdatedWorkflowPublicDto(updatedWorkflow);
    }
    async deleteWorkflow(req, _res, workflowId) {
        const workflow = await this.workflowService.deleteForPublicApi(req.user, workflowId);
        if (!workflow) {
            throw new errors_1.NotFoundError('Not Found');
        }
        return this.toDeletedWorkflowPublicDto(workflow);
    }
    async archiveWorkflow(req, _res, workflowId) {
        const workflow = await this.workflowService.archiveForPublicApi(req.user, workflowId);
        if (!workflow) {
            throw new errors_1.NotFoundError('Workflow not found');
        }
        return this.toWorkflowPublicDto(workflow);
    }
    async unarchiveWorkflow(req, _res, workflowId) {
        const workflow = await this.workflowService.unarchiveForPublicApi(req.user, workflowId);
        if (!workflow) {
            throw new errors_1.NotFoundError('Workflow not found');
        }
        return this.toWorkflowPublicDto(workflow);
    }
    async transferWorkflow(req, _res, workflowId, body) {
        await this.enterpriseWorkflowService.transferWorkflow(req.user, workflowId, body.destinationProjectId);
    }
    toWorkflowFieldsPublicDto(workflow, options = {}) {
        return {
            id: workflow.id,
            name: workflow.name,
            description: workflow.description,
            active: workflow.active,
            activeVersionId: workflow.activeVersionId,
            createdAt: workflow.createdAt.toISOString(),
            updatedAt: workflow.updatedAt.toISOString(),
            isArchived: workflow.isArchived,
            versionId: workflow.versionId,
            versionCounter: workflow.versionCounter,
            sourceWorkflowId: workflow.sourceWorkflowId,
            triggerCount: workflow.triggerCount,
            nodes: workflow.nodes,
            connections: workflow.connections,
            nodeGroups: workflow.nodeGroups,
            settings: toPublicJson(workflow.settings),
            staticData: toPublicJson(workflow.staticData),
            meta: toPublicJson(workflow.meta),
            ...(options.excludePinnedData ? {} : { pinData: toPublicJson(workflow.pinData) }),
            ...(workflow.tags ? { tags: workflow.tags.map(toPublicTag) } : {}),
        };
    }
    toWorkflowPublishPublicDto(workflow, options = {}) {
        return {
            ...this.toWorkflowFieldsPublicDto(workflow, options),
            activeVersion: workflow.activeVersion ? toPublicActiveVersion(workflow.activeVersion) : null,
        };
    }
    toUpdatedWorkflowPublicDto(workflow) {
        return {
            ...this.toWorkflowFieldsPublicDto(workflow),
            activeVersion: workflow.activeVersion
                ? toPublicUpdatedActiveVersion(workflow.activeVersion)
                : null,
        };
    }
    toDeletedWorkflowPublicDto(workflow) {
        return {
            ...this.toWorkflowFieldsPublicDto(workflow),
            shared: workflow.shared.map(toPublicSharedWorkflow),
            ...(workflow.activeVersion
                ? { activeVersion: toPublicActiveVersion(workflow.activeVersion) }
                : {}),
        };
    }
    toWorkflowPublicDto(workflow, options = {}) {
        return {
            ...this.toWorkflowPublishPublicDto(workflow, options),
            shared: workflow.shared.map(toPublicSharedWorkflow),
        };
    }
    async publishWorkflow(req, _res, workflowId, body) {
        const workflow = await this.workflowService.activateWorkflow(req.user, workflowId, {
            versionId: body.versionId,
            name: body.name,
            description: body.description,
            source: 'api',
        });
        return this.toWorkflowPublishPublicDto(workflow);
    }
    async unpublishWorkflow(req, _res, workflowId) {
        const workflow = await this.workflowService.deactivateWorkflow(req.user, workflowId, {
            source: 'api',
        });
        return this.toWorkflowPublicDto(workflow);
    }
    async activateWorkflow(req, res, workflowId, body) {
        return await this.publishWorkflow(req, res, workflowId, body);
    }
    async deactivateWorkflow(req, res, workflowId) {
        return await this.unpublishWorkflow(req, res, workflowId);
    }
    async getWorkflowHistory(req, _res, workflowId, query) {
        const { offset, limit } = (0, pagination_service_1.resolveOffsetPagination)(query);
        try {
            const versions = await this.workflowHistoryService.getList(req.user, workflowId, limit + 1, offset);
            const hasMore = versions.length > limit;
            const data = hasMore ? versions.slice(0, limit) : versions;
            return {
                data: data.map((version) => ({
                    ...version,
                    createdAt: version.createdAt.toISOString(),
                    updatedAt: version.updatedAt.toISOString(),
                })),
                nextCursor: (0, pagination_service_1.encodeNextCursor)({
                    offset,
                    limit,
                    numberOfTotalRecords: hasMore ? offset + limit + 1 : offset + data.length,
                }),
            };
        }
        catch (error) {
            if (error instanceof shared_workflow_not_found_error_1.SharedWorkflowNotFoundError) {
                throw new errors_1.NotFoundError('Not Found');
            }
            throw error;
        }
    }
    async getWorkflowVersion(req, _res, workflowId, workflowVersionId) {
        let version;
        try {
            version = await this.workflowHistoryService.getVersion(req.user, workflowId, workflowVersionId, {
                publishHistory: 'none',
            });
        }
        catch (error) {
            if (error instanceof shared_workflow_not_found_error_1.SharedWorkflowNotFoundError) {
                throw new errors_1.NotFoundError('Workflow not found');
            }
            if (error instanceof workflow_history_version_not_found_error_1.WorkflowHistoryVersionNotFoundError) {
                throw new errors_1.NotFoundError('Version not found');
            }
            throw error;
        }
        this.eventService.emit('user-retrieved-workflow-version', {
            userId: req.user.id,
            publicApi: true,
        });
        return toPublicWorkflowVersion(version);
    }
    async getWorkflowTags(req, _res, workflowId) {
        this.assertWorkflowTagsEnabled();
        const workflow = await this.workflowFinderService.findWorkflowForUser(workflowId, req.user, [
            'workflow:read',
        ]);
        if (!workflow) {
            throw new errors_1.NotFoundError('Not Found');
        }
        const tags = await this.tagService.getAllByWorkflowId(workflowId);
        return tags.map(toPublicTag);
    }
    async updateWorkflowTags(req, _res, workflowId, body) {
        this.assertWorkflowTagsEnabled();
        const tagIds = body.map((tag) => tag.id);
        const tags = await this.workflowService.updateWorkflowTags(req.user, workflowId, tagIds);
        return tags.map(toPublicTag);
    }
    async getDeprecatedWorkflowVersion(req, _res, workflowId, workflowVersionId) {
        try {
            const version = await this.workflowHistoryService.getVersion(req.user, workflowId, workflowVersionId, { publishHistory: 'none' });
            this.eventService.emit('user-retrieved-workflow-version', {
                userId: req.user.id,
                publicApi: true,
            });
            return toPublicWorkflowVersion(version);
        }
        catch (error) {
            throw new errors_1.NotFoundError('Version not found');
        }
    }
};
exports.WorkflowsPublicController = WorkflowsPublicController;
__decorate([
    (0, decorators_1.Get)('/'),
    (0, decorators_1.ApiKeyScope)('workflow:list'),
    (0, decorators_1.ApiSummary)('Retrieve all workflows'),
    (0, decorators_1.ApiDescription)('Retrieve all workflows from your instance.'),
    (0, decorators_1.ApiTags)(['Workflow']),
    (0, decorators_1.ApiResponse)(200, api_types_1.WorkflowListPublicDto),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.ListWorkflowsQueryDto]),
    __metadata("design:returntype", Promise)
], WorkflowsPublicController.prototype, "getWorkflows", null);
__decorate([
    (0, decorators_1.Post)('/'),
    (0, decorators_1.ApiKeyScope)('workflow:create'),
    (0, decorators_1.ApiSummary)('Create a workflow'),
    (0, decorators_1.ApiDescription)('Create a workflow in your instance.'),
    (0, decorators_1.ApiTags)(['Workflow']),
    (0, decorators_1.ApiResponse)(200, api_types_1.CreatedWorkflowPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(422),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.CreateWorkflowPublicDto]),
    __metadata("design:returntype", Promise)
], WorkflowsPublicController.prototype, "createWorkflow", null);
__decorate([
    (0, decorators_1.Get)('/:workflowId'),
    (0, decorators_1.ApiKeyScope)('workflow:read'),
    (0, decorators_1.ProjectScope)('workflow:read'),
    (0, decorators_1.ApiSummary)('Retrieve a workflow'),
    (0, decorators_1.ApiDescription)('Retrieve a workflow.'),
    (0, decorators_1.ApiTags)(['Workflow']),
    (0, decorators_1.ApiResponse)(200, api_types_1.RetrievedWorkflowPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('workflowId', api_types_1.workflowIdParamSchema)),
    __param(3, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.GetWorkflowQueryDto]),
    __metadata("design:returntype", Promise)
], WorkflowsPublicController.prototype, "getWorkflow", null);
__decorate([
    (0, decorators_1.Put)('/:workflowId'),
    (0, decorators_1.ApiKeyScope)('workflow:update'),
    (0, decorators_1.ProjectScope)('workflow:update'),
    (0, decorators_1.ApiSummary)('Update a workflow'),
    (0, decorators_1.ApiDescription)('Update a workflow. If the workflow is published, the updated version will be ' +
        'automatically re-published unless `publishIfActive` is set to `false`. Because that ' +
        're-publication puts a new version live, it additionally requires the `workflow:activate` ' +
        'API key scope and the `workflow:publish` project permission. A caller without either can ' +
        'still save: the new version is stored as a draft and the response is a `403` naming the ' +
        'missing permission, leaving the published version live. Saving an unpublished workflow, ' +
        'or saving with `publishIfActive=false`, only needs `workflow:update`.'),
    (0, decorators_1.ApiTags)(['Workflow']),
    (0, decorators_1.ApiResponse)(200, api_types_1.UpdatedWorkflowPublicDto),
    (0, decorators_1.ApiErrorResponse)(403, {
        dto: api_types_1.WorkflowPublishForbiddenErrorPublicDto,
        description: UPDATE_PUBLISH_FORBIDDEN_DESCRIPTION,
    }),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(422),
    (0, decorators_1.ApiErrorResponse)(409, {
        dto: api_types_1.WorkflowPublishBlockedErrorPublicDto,
        description: UPDATE_CONFLICT_DESCRIPTION,
    }),
    __param(2, (0, decorators_1.Param)('workflowId', api_types_1.workflowIdParamSchema)),
    __param(3, decorators_1.Body),
    __param(4, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.UpdateWorkflowPublicDto, api_types_1.UpdateWorkflowQueryDto]),
    __metadata("design:returntype", Promise)
], WorkflowsPublicController.prototype, "updateWorkflow", null);
__decorate([
    (0, decorators_1.Delete)('/:workflowId'),
    (0, decorators_1.ApiKeyScope)('workflow:delete'),
    (0, decorators_1.ProjectScope)('workflow:delete'),
    (0, decorators_1.ApiSummary)('Delete a workflow'),
    (0, decorators_1.ApiDescription)('Delete a workflow.'),
    (0, decorators_1.ApiTags)(['Workflow']),
    (0, decorators_1.ApiResponse)(200, api_types_1.DeletedWorkflowPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(409),
    __param(2, (0, decorators_1.Param)('workflowId', api_types_1.workflowIdParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], WorkflowsPublicController.prototype, "deleteWorkflow", null);
__decorate([
    (0, decorators_1.Post)('/:workflowId/archive'),
    (0, decorators_1.ApiKeyScope)('workflow:delete'),
    (0, decorators_1.ProjectScope)('workflow:delete'),
    (0, decorators_1.ApiSummary)('Archive a workflow'),
    (0, decorators_1.ApiDescription)('Soft-deletes a workflow by archiving it. Idempotent: archiving an already ' +
        'archived workflow returns 200 with the current workflow.'),
    (0, decorators_1.ApiTags)(['Workflow']),
    (0, decorators_1.ApiResponse)(200, api_types_1.WorkflowPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('workflowId', api_types_1.workflowIdParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], WorkflowsPublicController.prototype, "archiveWorkflow", null);
__decorate([
    (0, decorators_1.Post)('/:workflowId/unarchive'),
    (0, decorators_1.ApiKeyScope)('workflow:delete'),
    (0, decorators_1.ProjectScope)('workflow:delete'),
    (0, decorators_1.ApiSummary)('Unarchive a workflow'),
    (0, decorators_1.ApiDescription)('Restores an archived workflow.'),
    (0, decorators_1.ApiTags)(['Workflow']),
    (0, decorators_1.ApiResponse)(200, api_types_1.WorkflowPublicDto),
    (0, decorators_1.ApiErrorResponse)(400),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('workflowId', api_types_1.workflowIdParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], WorkflowsPublicController.prototype, "unarchiveWorkflow", null);
__decorate([
    (0, decorators_1.Put)('/:workflowId/transfer'),
    (0, decorators_1.ApiKeyScope)('workflow:move'),
    (0, decorators_1.ProjectScope)('workflow:move'),
    (0, decorators_1.ApiSummary)('Transfer a workflow to another project'),
    (0, decorators_1.ApiDescription)('Transfer a workflow to another project.'),
    (0, decorators_1.ApiTags)(['Workflow']),
    (0, decorators_1.ApiResponse)(204),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('workflowId', api_types_1.workflowIdParamSchema)),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.TransferWorkflowPublicDto]),
    __metadata("design:returntype", Promise)
], WorkflowsPublicController.prototype, "transferWorkflow", null);
__decorate([
    (0, decorators_1.Post)('/:workflowId/publish'),
    (0, decorators_1.ApiKeyScope)('workflow:activate'),
    (0, decorators_1.ProjectScope)('workflow:publish'),
    (0, decorators_1.ApiSummary)('Publish a workflow'),
    (0, decorators_1.ApiDescription)('Publish a workflow. In n8n v1, this action was termed activating a workflow.'),
    (0, decorators_1.ApiTags)(['Workflow']),
    (0, decorators_1.ApiResponse)(200, api_types_1.WorkflowPublishPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(409, {
        dto: api_types_1.WorkflowPublishBlockedErrorPublicDto,
        description: PUBLISH_CONFLICT_DESCRIPTION,
    }),
    __param(2, (0, decorators_1.Param)('workflowId', api_types_1.workflowIdParamSchema)),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.PublishWorkflowPublicDto]),
    __metadata("design:returntype", Promise)
], WorkflowsPublicController.prototype, "publishWorkflow", null);
__decorate([
    (0, decorators_1.Post)('/:workflowId/unpublish'),
    (0, decorators_1.ApiKeyScope)('workflow:deactivate'),
    (0, decorators_1.ProjectScope)('workflow:unpublish'),
    (0, decorators_1.ApiSummary)('Unpublish a workflow'),
    (0, decorators_1.ApiDescription)('Unpublish a workflow. In n8n v1, this action was termed deactivating a workflow.'),
    (0, decorators_1.ApiTags)(['Workflow']),
    (0, decorators_1.ApiResponse)(200, api_types_1.WorkflowPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('workflowId', api_types_1.workflowIdParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], WorkflowsPublicController.prototype, "unpublishWorkflow", null);
__decorate([
    (0, decorators_1.Post)('/:workflowId/activate'),
    (0, decorators_1.Deprecated)({ since: ACTIVATE_DEACTIVATE_DEPRECATED_SINCE }),
    (0, decorators_1.ApiKeyScope)('workflow:activate'),
    (0, decorators_1.ProjectScope)('workflow:publish'),
    (0, decorators_1.ApiSummary)('Publish a workflow'),
    (0, decorators_1.ApiDescription)('Deprecated: use POST /workflows/{id}/publish instead. Publish a workflow. In n8n v1, ' +
        'this action was termed activating a workflow.'),
    (0, decorators_1.ApiTags)(['Workflow']),
    (0, decorators_1.ApiResponse)(200, api_types_1.WorkflowPublishPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(409, {
        dto: api_types_1.WorkflowPublishBlockedErrorPublicDto,
        description: PUBLISH_CONFLICT_DESCRIPTION,
    }),
    __param(2, (0, decorators_1.Param)('workflowId', api_types_1.workflowIdParamSchema)),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.ActivateWorkflowPublicDto]),
    __metadata("design:returntype", Promise)
], WorkflowsPublicController.prototype, "activateWorkflow", null);
__decorate([
    (0, decorators_1.Post)('/:workflowId/deactivate'),
    (0, decorators_1.Deprecated)({ since: ACTIVATE_DEACTIVATE_DEPRECATED_SINCE }),
    (0, decorators_1.ApiKeyScope)('workflow:deactivate'),
    (0, decorators_1.ProjectScope)('workflow:unpublish'),
    (0, decorators_1.ApiSummary)('Deactivate a workflow'),
    (0, decorators_1.ApiDescription)('Deprecated: use POST /workflows/{id}/unpublish instead. Deactivate a workflow.'),
    (0, decorators_1.ApiTags)(['Workflow']),
    (0, decorators_1.ApiResponse)(200, api_types_1.WorkflowPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('workflowId', api_types_1.workflowIdParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], WorkflowsPublicController.prototype, "deactivateWorkflow", null);
__decorate([
    (0, decorators_1.Get)('/:workflowId/history'),
    (0, decorators_1.ApiKeyScope)('workflow:read'),
    (0, decorators_1.ProjectScope)('workflow:read'),
    (0, decorators_1.ApiSummary)('Retrieve workflow version history'),
    (0, decorators_1.ApiDescription)('Returns a paginated list of workflow versions (version IDs and metadata) for a workflow.'),
    (0, decorators_1.ApiTags)(['Workflow']),
    (0, decorators_1.ApiResponse)(200, api_types_1.WorkflowVersionHistoryListPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('workflowId', api_types_1.workflowIdParamSchema)),
    __param(3, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.ListWorkflowHistoryQueryDto]),
    __metadata("design:returntype", Promise)
], WorkflowsPublicController.prototype, "getWorkflowHistory", null);
__decorate([
    (0, decorators_1.Get)('/:workflowId/versions/:workflowVersionId'),
    (0, decorators_1.ApiKeyScope)('workflow:read'),
    (0, decorators_1.ProjectScope)('workflow:read'),
    (0, decorators_1.ApiSummary)('Retrieve a workflow version'),
    (0, decorators_1.ApiDescription)('Retrieve a single version of a workflow from its version history.'),
    (0, decorators_1.ApiTags)(['Workflow']),
    (0, decorators_1.ApiResponse)(200, api_types_1.WorkflowVersionPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('workflowId', api_types_1.workflowIdParamSchema)),
    __param(3, (0, decorators_1.Param)('workflowVersionId', api_types_1.workflowVersionIdParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], WorkflowsPublicController.prototype, "getWorkflowVersion", null);
__decorate([
    (0, decorators_1.Get)('/:workflowId/tags'),
    (0, decorators_1.ApiKeyScope)('workflowTags:list'),
    (0, decorators_1.ProjectScope)('workflow:read'),
    (0, decorators_1.ApiSummary)('Get workflow tags'),
    (0, decorators_1.ApiDescription)('Get workflow tags.'),
    (0, decorators_1.ApiTags)(['Workflow']),
    (0, decorators_1.ApiResponse)(200, api_types_1.WorkflowTagsPublicDto),
    (0, decorators_1.ApiErrorResponse)(400),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('workflowId', api_types_1.workflowIdParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], WorkflowsPublicController.prototype, "getWorkflowTags", null);
__decorate([
    (0, decorators_1.Put)('/:workflowId/tags'),
    (0, decorators_1.ApiKeyScope)('workflowTags:update'),
    (0, decorators_1.ProjectScope)('workflow:update'),
    (0, decorators_1.ApiSummary)('Update tags of a workflow'),
    (0, decorators_1.ApiDescription)('Update tags of a workflow.'),
    (0, decorators_1.ApiTags)(['Workflow']),
    (0, decorators_1.ApiResponse)(200, api_types_1.WorkflowTagsPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('workflowId', api_types_1.workflowIdParamSchema)),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.TagIdsPublicDto]),
    __metadata("design:returntype", Promise)
], WorkflowsPublicController.prototype, "updateWorkflowTags", null);
__decorate([
    (0, decorators_1.Get)('/:workflowId/:workflowVersionId'),
    (0, decorators_1.Deprecated)({ since: OLD_VERSION_PATH_DEPRECATED_SINCE }),
    (0, decorators_1.ApiKeyScope)('workflow:read'),
    (0, decorators_1.ProjectScope)('workflow:read'),
    (0, decorators_1.ApiSummary)('Retrieves a specific version of a workflow'),
    (0, decorators_1.ApiDescription)('Deprecated: use GET /workflows/{workflowId}/versions/{workflowVersionId} instead. ' +
        'Retrieves a specific version of a workflow from workflow history.'),
    (0, decorators_1.ApiTags)(['Workflow']),
    (0, decorators_1.ApiResponse)(200, api_types_1.DeprecatedWorkflowVersionPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('workflowId', api_types_1.workflowIdParamSchema)),
    __param(3, (0, decorators_1.Param)('workflowVersionId', api_types_1.workflowVersionIdParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], WorkflowsPublicController.prototype, "getDeprecatedWorkflowVersion", null);
exports.WorkflowsPublicController = WorkflowsPublicController = __decorate([
    (0, decorators_1.PublicApiController)('/workflows'),
    __metadata("design:paramtypes", [workflow_history_service_1.WorkflowHistoryService, workflow_finder_service_1.WorkflowFinderService, workflow_creation_service_1.WorkflowCreationService, workflow_service_1.WorkflowService, workflow_service_ee_1.EnterpriseWorkflowService, backend_services_1.EventService, config_1.GlobalConfig, tag_service_1.TagService, redaction_enforcement_service_1.RedactionEnforcementService])
], WorkflowsPublicController);
//# sourceMappingURL=workflows.public.controller.js.map