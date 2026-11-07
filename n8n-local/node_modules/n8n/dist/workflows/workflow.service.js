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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const permissions_1 = require("@n8n/permissions");
const typeorm_1 = require("@n8n/typeorm");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const isEqual_1 = __importDefault(require("lodash/isEqual"));
const pick_1 = __importDefault(require("lodash/pick"));
const n8n_workflow_1 = require("n8n-workflow");
const uuid_1 = require("uuid");
const error_workflow_validation_service_1 = require("./error-workflow-validation.service");
const deprecated_nodes_validation_service_1 = require("./deprecated-nodes-validation.service");
const workflow_publication_notifier_1 = require("./publication/workflow-publication-notifier");
const workflow_publication_status_service_1 = require("./publication/workflow-publication-status.service");
const node_group_rules_flag_gate_1 = require("./node-group-rules-flag-gate");
const enabled_trigger_nodes_1 = require("./triggers/enabled-trigger-nodes");
const utils_1 = require("./utils");
const workflow_finder_service_1 = require("./workflow-finder.service");
const workflow_history_service_1 = require("./workflow-history/workflow-history.service");
const workflow_validation_service_1 = require("./workflow-validation.service");
const active_workflow_manager_1 = require("../active-workflow-manager");
const folder_not_found_error_1 = require("../errors/folder-not-found.error");
const errors_1 = require("@n8n/errors");
const workflow_activation_bad_request_error_1 = require("../errors/response-errors/workflow-activation-bad-request.error");
const workflow_deactivation_bad_request_error_1 = require("../errors/response-errors/workflow-deactivation-bad-request.error");
const workflow_publish_forbidden_error_1 = require("../errors/response-errors/workflow-publish-forbidden.error");
const workflow_validation_error_1 = require("../errors/response-errors/workflow-validation.error");
const workflow_history_version_not_found_error_1 = require("../errors/workflow-history-version-not-found.error");
const execution_persistence_1 = require("../executions/execution-persistence");
const external_hooks_1 = require("../external-hooks");
const generic_helpers_1 = require("../generic-helpers");
const redaction_enforcement_service_1 = require("../modules/redaction/redaction-enforcement.service");
const node_types_1 = require("../node-types");
const check_access_1 = require("../permissions.ee/check-access");
const enforce_workflow_publish_1 = require("../policy/enforce-workflow-publish");
const policy_enforcement_service_1 = require("../policy/policy-enforcement.service");
const requests_1 = require("../requests");
const durable_job_provisioner_1 = require("../scheduling/durable-job-provisioner");
const poll_trigger_job_registrar_1 = require("../scheduling/poll-trigger-node/poll-trigger-job-registrar");
const schedule_trigger_job_registrar_1 = require("../scheduling/schedule-trigger-node/schedule-trigger-job-registrar");
const workflow_scheduled_job_owner_1 = require("../scheduling/workflow-scheduled-job-owner");
const ownership_service_1 = require("../services/ownership.service");
const project_service_ee_1 = require("../services/project.service.ee");
const tag_service_1 = require("../services/tag.service");
const constants_1 = require("../webhooks/constants");
const webhook_service_1 = require("../webhooks/webhook.service");
const workflow_execute_additional_data_1 = require("../workflow-execute-additional-data");
const WorkflowHelpers = __importStar(require("../workflow-helpers"));
const workflow_hook_context_service_1 = require("../workflow-hook-context.service");
class SystemPublishSupersededError extends Error {
}
const PUBLISH_API_KEY_SCOPE = 'workflow:activate';
let WorkflowService = class WorkflowService {
    constructor(logger, sharedWorkflowRepository, workflowRepository, workflowTagMappingRepository, ownershipService, tagService, workflowHistoryService, externalHooks, activeWorkflowManager, roleService, projectService, executionPersistence, eventService, globalConfig, folderRepository, workflowFinderService, workflowPublishHistoryRepository, outboxRepository, workflowValidationService, nodeTypes, webhookService, licenseState, projectRepository, redactionEnforcementService, workflowPublicationNotifier, scheduleTriggerJobRegistrar, pollTriggerJobRegistrar, workflowScheduledJobOwner, durableJobProvisioner, workflowPublishedVersionRepository, workflowHookContextService, workflowPublishGuard, workflowMutationHooks, policyEnforcementService, workflowPublicationStatusService, nodeGroupRulesFlagGate, errorWorkflowValidationService, restrictedNodeTypesProvider, deprecatedNodesValidationService) {
        this.logger = logger;
        this.sharedWorkflowRepository = sharedWorkflowRepository;
        this.workflowRepository = workflowRepository;
        this.workflowTagMappingRepository = workflowTagMappingRepository;
        this.ownershipService = ownershipService;
        this.tagService = tagService;
        this.workflowHistoryService = workflowHistoryService;
        this.externalHooks = externalHooks;
        this.activeWorkflowManager = activeWorkflowManager;
        this.roleService = roleService;
        this.projectService = projectService;
        this.executionPersistence = executionPersistence;
        this.eventService = eventService;
        this.globalConfig = globalConfig;
        this.folderRepository = folderRepository;
        this.workflowFinderService = workflowFinderService;
        this.workflowPublishHistoryRepository = workflowPublishHistoryRepository;
        this.outboxRepository = outboxRepository;
        this.workflowValidationService = workflowValidationService;
        this.nodeTypes = nodeTypes;
        this.webhookService = webhookService;
        this.licenseState = licenseState;
        this.projectRepository = projectRepository;
        this.redactionEnforcementService = redactionEnforcementService;
        this.workflowPublicationNotifier = workflowPublicationNotifier;
        this.scheduleTriggerJobRegistrar = scheduleTriggerJobRegistrar;
        this.pollTriggerJobRegistrar = pollTriggerJobRegistrar;
        this.workflowScheduledJobOwner = workflowScheduledJobOwner;
        this.durableJobProvisioner = durableJobProvisioner;
        this.workflowPublishedVersionRepository = workflowPublishedVersionRepository;
        this.workflowHookContextService = workflowHookContextService;
        this.workflowPublishGuard = workflowPublishGuard;
        this.workflowMutationHooks = workflowMutationHooks;
        this.policyEnforcementService = policyEnforcementService;
        this.workflowPublicationStatusService = workflowPublicationStatusService;
        this.nodeGroupRulesFlagGate = nodeGroupRulesFlagGate;
        this.errorWorkflowValidationService = errorWorkflowValidationService;
        this.restrictedNodeTypesProvider = restrictedNodeTypesProvider;
        this.deprecatedNodesValidationService = deprecatedNodesValidationService;
    }
    async assertErrorWorkflowChangeAllowed(user, workflowId, currentSettings, updateSettings) {
        const nextId = (0, error_workflow_validation_service_1.staticErrorWorkflowId)(updateSettings?.errorWorkflow);
        if (!nextId || nextId === (0, error_workflow_validation_service_1.staticErrorWorkflowId)(currentSettings?.errorWorkflow))
            return;
        const problem = await this.errorWorkflowValidationService.findProblem({
            errorWorkflowId: nextId,
            parentWorkflowId: workflowId,
            user,
        });
        if (!problem)
            return;
        this.logger.warn('Rejected an error workflow reference the user may not set', {
            workflowId,
            errorWorkflowId: nextId,
            userId: user.id,
            reason: problem.reason,
        });
        const messages = {
            'not-found': 'The selected error workflow does not exist or you do not have access to it.',
            'not-published': 'The selected error workflow has no published version.',
            'no-error-trigger': 'The published version of the selected error workflow has no active Error Trigger node.',
            'caller-policy': 'The selected error workflow does not allow this workflow to call it. Update its "This workflow can be called by" setting.',
        };
        throw new errors_1.BadRequestError(messages[problem.reason]);
    }
    async getMany(user, options, { includeScopes = false, includeFolders = false, onlySharedWithMe = false, includePublicationStatus = false, requiredScopes = ['workflow:read'], } = {}) {
        let count;
        let workflows;
        let workflowsAndFolders = [];
        let isPersonalProject = false;
        let personalProjectOwnerId = null;
        if (options?.filter?.projectId) {
            const project = await this.projectRepository.findOneBy({
                id: options.filter.projectId,
            });
            if (!project) {
                return { workflows: [], count: 0 };
            }
            isPersonalProject = project.type === 'personal';
            personalProjectOwnerId = project.creatorId;
        }
        const sharingOptions = {};
        if (isPersonalProject && personalProjectOwnerId) {
            if (personalProjectOwnerId !== user.id && !(0, permissions_1.hasGlobalScope)(user, 'workflow:read')) {
                return { workflows: [], count: 0 };
            }
            sharingOptions.isPersonalProject = true;
            sharingOptions.personalProjectOwnerId = personalProjectOwnerId;
        }
        else if (onlySharedWithMe) {
            sharingOptions.onlySharedWithMe = true;
        }
        else {
            const projectRoles = await this.roleService.rolesWithScope('project', requiredScopes);
            const workflowRoles = await this.roleService.rolesWithScope('workflow', requiredScopes);
            sharingOptions.scopes = requiredScopes;
            sharingOptions.projectRoles = projectRoles;
            sharingOptions.workflowRoles = workflowRoles;
        }
        const workflowIdsIn = await this.resolveRestrictedWorkflowIds(options);
        const listOptions = workflowIdsIn === undefined ? options : { ...options, workflowIdsIn };
        if (includeFolders) {
            [workflowsAndFolders, count] =
                await this.workflowRepository.getWorkflowsAndFoldersWithCountWithSharingSubquery(user, sharingOptions, listOptions);
            workflows = workflowsAndFolders.filter((wf) => wf.resource === 'workflow');
        }
        else {
            ({ workflows, count } = await this.workflowRepository.getManyAndCountWithSharingSubquery(user, sharingOptions, listOptions));
        }
        if ((0, requests_1.hasSharing)(workflows)) {
            workflows = await this.processSharedWorkflows(workflows, options);
        }
        if (includeScopes) {
            workflows = await this.addUserScopes(workflows, user);
        }
        this.cleanupSharedField(workflows);
        const publicationStatuses = includePublicationStatus && this.globalConfig.workflows.useWorkflowPublicationService
            ? this.getListPublicationStatuses(workflows.map((w) => w.id))
            : null;
        if (includeFolders) {
            workflows = this.mergeProcessedWorkflows(workflowsAndFolders, workflows);
        }
        if (this.licenseState.isDynamicCredentialsLicensed()) {
            workflows = await this.addResolvableCredentialsFlag(workflows);
        }
        if (publicationStatuses) {
            const statuses = await publicationStatuses;
            workflows = workflows.map((workflow) => {
                const publicationStatus = statuses.get(workflow.id);
                return publicationStatus ? { ...workflow, publicationStatus } : workflow;
            });
        }
        return {
            workflows,
            count,
        };
    }
    async getCallableSubworkflows(user, parentWorkflowId, { query, skip, take }) {
        const requiredScopes = ['workflow:read'];
        const [projectRoles, workflowRoles] = await Promise.all([
            this.roleService.rolesWithScope('project', requiredScopes),
            this.roleService.rolesWithScope('workflow', requiredScopes),
        ]);
        const { workflows, count } = await this.workflowRepository.findCallableSubworkflows(user, { scopes: requiredScopes, projectRoles, workflowRoles }, parentWorkflowId, { query, triggerNodeTypes: [n8n_workflow_1.EXECUTE_WORKFLOW_TRIGGER_NODE_TYPE], skip, take });
        const data = workflows.map((workflow) => {
            const project = workflow.shared?.[0]?.project;
            return {
                id: workflow.id,
                name: workflow.name,
                active: workflow.activeVersionId !== null,
                isArchived: workflow.isArchived,
                ...(project?.type === 'team' ? { projectName: project.name } : {}),
            };
        });
        return { count, data };
    }
    async resolveRestrictedWorkflowIds(options) {
        const executionBlockedBy = options?.filter?.executionBlockedBy;
        if (!(0, db_1.isStringArray)(executionBlockedBy) ||
            !executionBlockedBy.includes('restrictedNode'))
            return undefined;
        return await this.restrictedNodeTypesProvider.findRestrictedWorkflowIds();
    }
    async getListPublicationStatuses(workflowIds) {
        try {
            return await this.workflowPublicationStatusService.getListStatusesByWorkflowIds(workflowIds);
        }
        catch (error) {
            this.logger.warn('Failed to resolve publication statuses for the workflow list', {
                error: (0, ensure_error_1.ensureError)(error),
            });
            return new Map();
        }
    }
    async addResolvableCredentialsFlag(workflows) {
        const { EnterpriseWorkflowService } = await import('./workflow.service.ee.js');
        const enterpriseWorkflowService = di_1.Container.get(EnterpriseWorkflowService);
        const workflowIds = workflows.map((w) => w.id);
        const workflowIdsWithResolvable = await enterpriseWorkflowService.getWorkflowIdsWithResolvableCredentials(workflowIds);
        return workflows.map((workflow) => ({
            ...workflow,
            hasResolvableCredentials: workflowIdsWithResolvable.has(workflow.id),
        }));
    }
    async processSharedWorkflows(workflows, options) {
        const projectId = options?.filter?.projectId;
        const shouldAddProjectRelations = typeof projectId === 'string' && projectId !== '';
        if (shouldAddProjectRelations) {
            await this.addSharedRelation(workflows);
        }
        return workflows.map((workflow) => this.ownershipService.addOwnedByAndSharedWith(workflow));
    }
    async addSharedRelation(workflows) {
        const workflowIds = workflows.map((workflow) => workflow.id);
        const relations = await this.sharedWorkflowRepository.getAllRelationsForWorkflows(workflowIds);
        workflows.forEach((workflow) => {
            workflow.shared = relations.filter((relation) => relation.workflowId === workflow.id);
        });
    }
    async addUserScopes(workflows, user) {
        const projectRelations = await this.projectService.getProjectRelationsForUser(user);
        return workflows.map((workflow) => this.roleService.addScopes(workflow, user, projectRelations));
    }
    isWorkflowWithSharing(workflow) {
        return 'shared' in workflow;
    }
    cleanupSharedField(workflows) {
        workflows.forEach((workflow) => {
            if (this.isWorkflowWithSharing(workflow)) {
                delete workflow.shared;
            }
        });
    }
    mergeProcessedWorkflows(workflowsAndFolders, processedWorkflows) {
        const workflowMap = new Map(processedWorkflows.map((workflow) => [workflow.id, workflow]));
        return workflowsAndFolders.map((item) => item.resource === 'workflow' ? (workflowMap.get(item.id) ?? item) : item);
    }
    async update(user, workflowUpdateData, workflowId, options = {}) {
        const prepared = await this.prepareUpdate(user, workflowUpdateData, workflowId, options);
        const saved = await this.savePreparedUpdate(prepared);
        return await this.finishUpdate(prepared, saved);
    }
    async prepareUpdate(user, workflowUpdateData, workflowId, options = {}) {
        const { expectedChecksum, tagIds, parentFolderId, forceSave = false, publicApi = false, publishIfActive = false, apiKeyScopes, aiBuilderAssisted = false, autosaved = false, source = 'ui', versionName, versionDescription, allowArchivedUpdate = false, allowUnresolvedErrorWorkflow = false, restoredFromVersionId, } = options;
        const workflow = await this.workflowFinderService.findWorkflowForUser(workflowId, user, [
            'workflow:update',
        ]);
        if (!workflow) {
            this.logger.warn('User attempted to update a workflow without permissions', {
                workflowId,
                userId: user.id,
            });
            throw new errors_1.NotFoundError('You do not have permission to update this workflow. Ask the owner to share it with you.');
        }
        if (workflow.isArchived && !allowArchivedUpdate) {
            throw new errors_1.BadRequestError('Cannot update an archived workflow.');
        }
        await this.redactionEnforcementService.assertPolicyChangeAllowed(workflow.settings?.redactionPolicy, workflowUpdateData.settings?.redactionPolicy);
        if (!allowUnresolvedErrorWorkflow) {
            await this.assertErrorWorkflowChangeAllowed(user, workflowId, workflow.settings, workflowUpdateData.settings);
        }
        if (!forceSave && expectedChecksum) {
            await this._detectConflicts(workflow, expectedChecksum);
        }
        const ownerProject = await this.ownershipService.getWorkflowProjectCached(workflowId);
        await WorkflowHelpers.replaceInvalidCredentials(workflowUpdateData, ownerProject.id);
        if (this.licenseState.isSharingLicensed()) {
            let restoredNodes;
            if (restoredFromVersionId) {
                const restoredVersion = await this.workflowHistoryService.findVersion(workflowId, restoredFromVersionId);
                if (!restoredVersion) {
                    throw new errors_1.BadRequestError("The version to restore is not in this workflow's history.");
                }
                const normalizedVersion = await WorkflowHelpers.replaceInvalidCredentials({ ...workflowUpdateData, nodes: structuredClone(restoredVersion.nodes) }, ownerProject.id);
                restoredNodes = normalizedVersion.nodes;
            }
            const { EnterpriseWorkflowService } = await import('./workflow.service.ee.js');
            await di_1.Container.get(EnterpriseWorkflowService).preventTampering(workflowUpdateData, workflowId, user, restoredNodes);
        }
        const hasNodesKey = 'nodes' in workflowUpdateData;
        const hasConnectionsKey = 'connections' in workflowUpdateData;
        const hasNodeGroupsKey = 'nodeGroups' in workflowUpdateData;
        const nodesChanged = hasNodesKey && !(0, isEqual_1.default)(workflowUpdateData.nodes, workflow.nodes);
        const connectionsChanged = hasConnectionsKey && !(0, isEqual_1.default)(workflowUpdateData.connections, workflow.connections);
        const nodeGroupsChanged = hasNodeGroupsKey && !(0, isEqual_1.default)(workflowUpdateData.nodeGroups, workflow.nodeGroups);
        const saveNewVersion = nodesChanged || connectionsChanged || nodeGroupsChanged;
        if (saveNewVersion) {
            workflowUpdateData.versionId = (0, uuid_1.v4)();
            this.logger.debug(`Updating versionId for workflow ${workflowId} for user ${user.id} after saving`, {
                previousVersionId: workflow.versionId,
                newVersionId: workflowUpdateData.versionId,
            });
            workflowUpdateData.nodes = workflowUpdateData.nodes ?? workflow.nodes;
            workflowUpdateData.connections = workflowUpdateData.connections ?? workflow.connections;
            workflowUpdateData.nodeGroups = workflowUpdateData.nodeGroups ?? workflow.nodeGroups;
        }
        else {
            workflowUpdateData.versionId = workflow.versionId;
        }
        WorkflowHelpers.addNodeIds(workflowUpdateData);
        WorkflowHelpers.resolveNodeWebhookIds(workflowUpdateData, this.nodeTypes);
        if (saveNewVersion) {
            WorkflowHelpers.validateWorkflowStructure({
                nodes: workflowUpdateData.nodes,
                connections: workflowUpdateData.connections,
            });
            const rules = workflowUpdateData.nodeGroups?.length
                ? await this.nodeGroupRulesFlagGate.getEnabledRules(user)
                : {};
            WorkflowHelpers.validateWorkflowNodeGroups({
                nodes: workflowUpdateData.nodes,
                nodeGroups: workflowUpdateData.nodeGroups,
                connections: workflowUpdateData.connections,
            }, WorkflowHelpers.makeGetNodeTypeForGrouping(this.nodeTypes), rules);
        }
        if (hasNodesKey && nodesChanged) {
            this.deprecatedNodesValidationService.validateOnUpdate(workflowUpdateData.nodes, workflow.nodes, workflow.id);
        }
        if (workflowUpdateData.settings?.redactionPolicy !== undefined &&
            workflowUpdateData.settings.redactionPolicy !== workflow.settings?.redactionPolicy &&
            !this.licenseState.isDataRedactionLicensed()) {
            delete workflowUpdateData.settings.redactionPolicy;
        }
        if (workflowUpdateData.settings?.redactionPolicy !== undefined &&
            workflowUpdateData.settings.redactionPolicy !== workflow.settings?.redactionPolicy) {
            const requiredScopes = (0, utils_1.getRequiredRedactionScopes)(workflow.settings?.redactionPolicy, workflowUpdateData.settings.redactionPolicy);
            const canUpdate = await (0, check_access_1.userHasScopes)(user, requiredScopes, false, {
                projectId: ownerProject.id,
            });
            if (!canUpdate) {
                delete workflowUpdateData.settings.redactionPolicy;
            }
        }
        if (workflowUpdateData.settings && workflow.settings) {
            workflowUpdateData.settings = {
                ...workflow.settings,
                ...workflowUpdateData.settings,
            };
        }
        if (workflowUpdateData.settings) {
            workflowUpdateData.settings = WorkflowHelpers.removeDefaultValues(workflowUpdateData.settings, this.globalConfig.executions.timeout);
        }
        const settingsChanged = workflowUpdateData.settings !== undefined &&
            !(0, isEqual_1.default)(workflow.settings, workflowUpdateData.settings);
        workflowUpdateData.updatedAt = new Date();
        if (workflowUpdateData.name) {
            await (0, generic_helpers_1.validateEntity)(workflowUpdateData);
        }
        if ('pinData' in workflowUpdateData) {
            WorkflowHelpers.validatePinDataSize({ ...workflow, ...workflowUpdateData });
        }
        const restrictionValidation = this.workflowValidationService.validateCredentialNodeRestrictions(workflowUpdateData.nodes ?? workflow.nodes);
        if (!restrictionValidation.isValid) {
            throw new workflow_validation_error_1.WorkflowValidationError(restrictionValidation.error ?? 'Credential binding is not allowed.');
        }
        await this.externalHooks.run('workflow.update', [
            workflowUpdateData,
            this.workflowHookContextService,
            (0, external_hooks_1.toWorkflowLifecycleHookActor)(user),
        ]);
        const cleared = await this.policyEnforcementService.enforceWorkflowSave({
            workflow: {
                id: workflow.id,
                name: workflowUpdateData.name ?? workflow.name,
                nodes: workflowUpdateData.nodes ?? workflow.nodes,
            },
            storedWorkflow: { id: workflow.id, name: workflow.name, nodes: workflow.nodes },
            projectId: ownerProject.id,
        }, { kind: 'user', user });
        const fieldsToUpdate = [
            'name',
            'nodes',
            'connections',
            'nodeGroups',
            'meta',
            'settings',
            'staticData',
            'pinData',
            'versionId',
            'description',
            'updatedAt',
        ];
        const updatePayload = (0, pick_1.default)(workflowUpdateData, fieldsToUpdate);
        const versionIdToPublish = workflow.activeVersionId && publishIfActive ? workflowUpdateData.versionId : null;
        if (parentFolderId) {
            const project = await this.sharedWorkflowRepository.getWorkflowOwningProject(workflow.id);
            if (parentFolderId !== n8n_workflow_1.PROJECT_ROOT) {
                try {
                    await this.folderRepository.findOneOrFailFolderInProject(parentFolderId, project?.id ?? '');
                }
                catch (e) {
                    throw new folder_not_found_error_1.FolderNotFoundError(parentFolderId);
                }
            }
            updatePayload.parentFolder = parentFolderId === n8n_workflow_1.PROJECT_ROOT ? null : { id: parentFolderId };
        }
        return {
            user,
            previousWorkflow: workflow,
            workflow: Object.assign(new db_1.WorkflowEntity(), workflow, updatePayload),
            changes: workflowUpdateData,
            updatePayload,
            cleared,
            saveNewVersion,
            tagsDisabled: this.globalConfig.tags.disabled,
            versionIdToPublish,
            settingsChanged,
            options: {
                tagIds,
                autosaved,
                source,
                publicApi,
                apiKeyScopes,
                aiBuilderAssisted,
                versionName,
                versionDescription,
            },
        };
    }
    async savePreparedUpdate(prepared, ctx = {}, { propagateVersionHistoryErrors = false } = {}) {
        const { user, changes, updatePayload, cleared, saveNewVersion, tagsDisabled } = prepared;
        const workflowId = prepared.workflow.id;
        const { tagIds, autosaved, source, versionName, versionDescription } = prepared.options;
        if (saveNewVersion) {
            const versionMetadata = versionName || versionDescription
                ? { name: versionName, description: versionDescription }
                : undefined;
            await this.workflowHistoryService.saveVersion(user, changes, workflowId, autosaved, source, undefined, versionMetadata, { ctx, propagateErrors: propagateVersionHistoryErrors });
        }
        await this.workflowRepository.updateContent(workflowId, updatePayload, {
            ...ctx,
            policyCleared: cleared,
        });
        if (tagIds && !tagsDisabled) {
            await this.workflowTagMappingRepository.overwriteTaggings(workflowId, tagIds, ctx);
        }
        const savedWorkflow = await this.workflowRepository.get({ id: workflowId }, { relations: tagsDisabled ? ['activeVersion'] : ['tags', 'activeVersion'] }, ctx);
        if (!savedWorkflow) {
            throw new errors_1.BadRequestError(`Workflow with ID "${workflowId}" could not be found to be updated.`);
        }
        return savedWorkflow;
    }
    async finishUpdate(prepared, updatedWorkflow) {
        const { user, previousWorkflow: workflow, versionIdToPublish, settingsChanged } = prepared;
        const workflowId = workflow.id;
        const { tagIds, source, publicApi, apiKeyScopes, aiBuilderAssisted } = prepared.options;
        if (updatedWorkflow.tags?.length && tagIds?.length) {
            updatedWorkflow.tags = this.tagService.sortByRequestOrder(updatedWorkflow.tags, {
                requestOrder: tagIds,
            });
        }
        await this.externalHooks.run('workflow.afterUpdate', [
            updatedWorkflow,
            this.workflowHookContextService,
            (0, external_hooks_1.toWorkflowLifecycleHookActor)(user),
        ]);
        const settingsChangesDetail = this.calculateSettingsChanges(workflow.settings, updatedWorkflow.settings);
        this.eventService.emit('workflow-saved', {
            user,
            workflow: updatedWorkflow,
            publicApi,
            previousWorkflow: workflow,
            aiBuilderAssisted,
            ...(settingsChangesDetail && { settingsChanged: settingsChangesDetail }),
            source,
        });
        if (versionIdToPublish) {
            if (versionIdToPublish !== workflow.activeVersionId) {
                await this.assertMayPublishOnSave(user, workflowId, apiKeyScopes, versionIdToPublish);
            }
            const publishedWorkflow = await this.activateWorkflow(user, workflowId, {
                versionId: versionIdToPublish,
                source,
            });
            updatedWorkflow.active = publishedWorkflow.active;
            updatedWorkflow.activeVersionId = publishedWorkflow.activeVersionId;
            updatedWorkflow.activeVersion = publishedWorkflow.activeVersion;
        }
        else if (settingsChanged && workflow.activeVersionId) {
            await this.activateWorkflow(user, workflowId, {
                versionId: workflow.activeVersionId,
                source,
                publishHistory: 'none',
            });
        }
        return updatedWorkflow;
    }
    async assertMayPublishOnSave(user, workflowId, apiKeyScopes, savedVersionId) {
        if (apiKeyScopes && !apiKeyScopes.includes(PUBLISH_API_KEY_SCOPE)) {
            throw new workflow_publish_forbidden_error_1.WorkflowPublishForbiddenError({
                reason: 'insufficient_api_key_scope',
                versionId: savedVersionId,
            });
        }
        const canPublish = await (0, check_access_1.userHasScopes)(user, ['workflow:publish'], false, { workflowId });
        if (!canPublish) {
            this.logger.warn('User saved a draft but may not publish it', {
                workflowId,
                userId: user.id,
            });
            throw new workflow_publish_forbidden_error_1.WorkflowPublishForbiddenError({
                reason: 'insufficient_permissions',
                versionId: savedVersionId,
            });
        }
    }
    async _addToActiveWorkflowManager(user, workflowId, workflow, mode, options = { source: 'ui' }) {
        let didPublish = false;
        try {
            await this.activeWorkflowManager.add(workflowId, mode, undefined, {
                actor: { kind: 'user', user },
            });
            didPublish = true;
        }
        catch (error) {
            try {
                await this.activeWorkflowManager.remove(workflowId);
                this.logger.warn(`Rolled back partial activation of workflow "${workflowId}"; triggers deregistered`, { workflowId });
            }
            catch (cleanupError) {
                this.logger.error(`Failed to roll back partial activation of workflow "${workflowId}"`, {
                    workflowId,
                    error: cleanupError,
                });
            }
            const rollbackPayload = {
                active: false,
                activeVersionId: null,
                activeVersion: null,
            };
            await this.workflowRepository.update(workflowId, rollbackPayload);
            workflow.active = rollbackPayload.active;
            workflow.activeVersionId = rollbackPayload.activeVersionId;
            workflow.activeVersion = rollbackPayload.activeVersion;
            const message = error.message;
            const description = (0, utils_1.getErrorDescription)(error);
            throw new workflow_activation_bad_request_error_1.WorkflowActivationBadRequestError(message, {
                nodeId: (0, utils_1.getErrorNodeId)(error),
                description,
            });
        }
        finally {
            if (didPublish) {
                (0, n8n_workflow_1.assert)(workflow.activeVersionId !== null);
                await this.workflowPublishHistoryRepository.addRecord({
                    workflowId,
                    versionId: workflow.activeVersionId,
                    event: 'activated',
                    userId: user.id,
                });
                this.eventService.emit('workflow-activated', {
                    user,
                    workflowId,
                    workflow,
                    publicApi: options.source === 'api',
                    source: options.source,
                });
            }
        }
    }
    async _findConflictingWebhooks(workflowEntity, versionToActivate) {
        const workflow = new n8n_workflow_1.Workflow({
            id: workflowEntity.id,
            nodes: versionToActivate.nodes,
            connections: versionToActivate.connections,
            active: !!workflowEntity.activeVersion,
            settings: workflowEntity.settings,
            nodeTypes: this.nodeTypes,
        });
        const additionalData = await (0, workflow_execute_additional_data_1.getBase)({
            workflowId: workflow.id,
        });
        await workflow.expression.acquireIsolate();
        try {
            return await this.webhookService.findWebhookConflicts(workflow, additionalData);
        }
        finally {
            await workflow.expression.releaseIsolate();
        }
    }
    async _detectWebhookConflicts(workflowEntity, versionToActivate) {
        const conflicts = await this._findConflictingWebhooks(workflowEntity, versionToActivate);
        if (conflicts.length > 0) {
            throw new errors_1.ConflictError(constants_1.WEBHOOK_CONFLICT_MESSAGE, JSON.stringify(conflicts.map(({ trigger, conflict }) => ({
                trigger,
                conflict,
            }))));
        }
    }
    async activateWorkflow(user, workflowId, options) {
        const source = options?.source ?? 'ui';
        const publicApi = source === 'api';
        let workflow = await this.workflowFinderService.findWorkflowForUser(workflowId, user, [
            'workflow:publish',
        ]);
        const resolvedWithEditorScopes = workflow === null;
        if (resolvedWithEditorScopes) {
            workflow = await this.workflowFinderService.findWorkflowForUser(workflowId, user, [
                'workflow:read',
                'workflow:update',
            ]);
        }
        if (!workflow) {
            this.logger.warn('User attempted to activate a workflow without permissions', {
                workflowId,
                userId: user.id,
            });
            throw new errors_1.NotFoundError('You do not have permission to activate this workflow. Ask the owner to share it with you.');
        }
        if (workflow.isArchived) {
            throw new errors_1.BadRequestError('Cannot activate an archived workflow.');
        }
        const versionIdToActivate = options?.versionId ?? workflow.versionId;
        const previousActiveVersionId = workflow.activeVersionId;
        if (resolvedWithEditorScopes && versionIdToActivate !== previousActiveVersionId) {
            this.logger.warn('User attempted to publish a workflow without permissions', {
                workflowId,
                userId: user.id,
            });
            throw new errors_1.ForbiddenError('You do not have permission to publish this workflow. Ask the owner to publish it for you.');
        }
        let versionToActivate;
        try {
            versionToActivate = await this.workflowHistoryService.getVersion(user, workflow.id, versionIdToActivate, {
                publishHistory: 'none',
            });
        }
        catch (error) {
            if (error instanceof workflow_history_version_not_found_error_1.WorkflowHistoryVersionNotFoundError) {
                throw new errors_1.NotFoundError('Version not found');
            }
            throw error;
        }
        if (options?.expectedChecksum) {
            await this._detectConflicts(workflow, options.expectedChecksum);
        }
        await this._detectWebhookConflicts(workflow, versionToActivate);
        await this._validateNodes(workflowId, versionToActivate.nodes, versionToActivate.connections);
        await this._validateDynamicCredentials(workflowId, versionToActivate.nodes, workflow.settings);
        if (versionIdToActivate !== previousActiveVersionId) {
            await this._validatePublisherCredentialAccess(workflowId, user, versionToActivate.nodes);
        }
        await this._validateSubWorkflowReferences(workflowId, versionToActivate.nodes);
        if (this.globalConfig.workflows.useWorkflowPublicationService) {
            this._validateTriggerNodeIds(workflowId, versionToActivate);
        }
        const nodesToPublish = structuredClone(versionToActivate.nodes);
        const candidateWorkflow = this.workflowRepository.create({
            ...workflow,
            active: true,
            activeVersionId: versionIdToActivate,
            activeVersion: versionToActivate,
            nodes: versionToActivate.nodes,
            connections: versionToActivate.connections,
        });
        try {
            await this.externalHooks.run('workflow.activate', [
                candidateWorkflow,
                this.workflowHookContextService,
                (0, external_hooks_1.toWorkflowLifecycleHookActor)(user),
            ]);
        }
        catch (error) {
            throw new workflow_activation_bad_request_error_1.WorkflowActivationBadRequestError((0, ensure_error_1.ensureError)(error).message, {
                nodeId: (0, utils_1.getErrorNodeId)(error),
                description: (0, utils_1.getErrorDescription)(error),
            });
        }
        await (0, enforce_workflow_publish_1.enforceWorkflowPublishPolicy)(this.policyEnforcementService, this.ownershipService, { id: workflowId, name: workflow.name, nodes: nodesToPublish }, { kind: 'user', user });
        if (versionIdToActivate !== previousActiveVersionId) {
            await this.workflowPublishGuard.assertCanPublish(workflowId);
        }
        if (this.globalConfig.workflows.useWorkflowPublicationService) {
            await this._publishViaOutbox(user.id, workflowId, versionIdToActivate, previousActiveVersionId, workflow.updatedAt);
            if (previousActiveVersionId) {
                this.eventService.emit('workflow-deactivated', {
                    user,
                    workflowId,
                    workflow,
                    publicApi,
                    deactivatedVersionId: previousActiveVersionId,
                    source,
                });
            }
            const activatedWorkflow = this.workflowRepository.create({
                ...workflow,
                active: true,
                activeVersionId: versionIdToActivate,
                activeVersion: versionToActivate,
                nodes: versionToActivate.nodes,
                connections: versionToActivate.connections,
            });
            this.eventService.emit('workflow-activated', {
                user,
                workflowId,
                workflow: activatedWorkflow,
                publicApi,
                source,
            });
        }
        else {
            if (previousActiveVersionId) {
                await this.activeWorkflowManager.remove(workflowId);
                this.eventService.emit('workflow-deactivated', {
                    user,
                    workflowId,
                    workflow,
                    publicApi,
                    deactivatedVersionId: previousActiveVersionId,
                    source,
                });
                await this.workflowPublishHistoryRepository.addRecord({
                    workflowId,
                    versionId: previousActiveVersionId,
                    event: 'deactivated',
                    userId: user.id,
                });
            }
            const activationMode = previousActiveVersionId ? 'update' : 'activate';
            await this.workflowRepository.update(workflowId, {
                activeVersionId: versionIdToActivate,
                active: true,
                updatedAt: workflow.updatedAt,
            });
            const workflowForActivation = await this.workflowRepository.findOne({
                where: { id: workflowId },
                relations: ['activeVersion'],
            });
            if (!workflowForActivation) {
                throw new errors_1.NotFoundError(`Workflow with ID "${workflowId}" could not be found.`);
            }
            await this._addToActiveWorkflowManager(user, workflowId, workflowForActivation, activationMode, { source });
        }
        await this.workflowMutationHooks.afterWorkflowPublished({
            workflowId,
            versionId: versionIdToActivate,
            userId: user.id,
        });
        if (options?.name !== undefined || options?.description !== undefined) {
            const updateFields = {};
            if (options.name !== undefined)
                updateFields.name = options.name;
            if (options.description !== undefined)
                updateFields.description = options.description;
            await this.workflowHistoryService.updateVersion(workflowId, versionIdToActivate, updateFields);
        }
        const updatedWorkflow = await this.workflowRepository.findOne({
            where: { id: workflowId },
            relations: { activeVersion: true },
        });
        if (!updatedWorkflow) {
            throw new errors_1.NotFoundError(`Workflow with ID "${workflowId}" could not be found.`);
        }
        const publishHistory = options?.publishHistory ?? 'all';
        if (updatedWorkflow.activeVersion && publishHistory !== 'none') {
            updatedWorkflow.activeVersion.workflowPublishHistory =
                await this.workflowPublishHistoryRepository.findByVersion(workflowId, updatedWorkflow.activeVersion.versionId, publishHistory);
        }
        return updatedWorkflow;
    }
    async deactivateWorkflow(user, workflowId, options) {
        const source = options?.source ?? 'ui';
        const publicApi = source === 'api';
        const workflow = await this.workflowFinderService.findWorkflowForUser(workflowId, user, ['workflow:unpublish'], { includeActiveVersion: true, publishHistory: 'none' });
        if (!workflow) {
            this.logger.warn('User attempted to deactivate a workflow without permissions', {
                workflowId,
                userId: user.id,
            });
            throw new errors_1.NotFoundError('You do not have permission to deactivate this workflow. Ask the owner to share it with you.');
        }
        const deactivatedVersionId = workflow.activeVersionId;
        if (deactivatedVersionId === null) {
            return workflow;
        }
        if (options?.expectedChecksum) {
            await this._detectConflicts(workflow, options.expectedChecksum);
        }
        const deactivatedWorkflow = this.workflowRepository.create({
            ...workflow,
            versionId: deactivatedVersionId,
            activeVersion: null,
            nodes: workflow.activeVersion?.nodes ?? workflow.nodes,
            connections: workflow.activeVersion?.connections ?? workflow.connections,
        });
        try {
            await this.externalHooks.run('workflow.deactivate', [
                deactivatedWorkflow,
                this.workflowHookContextService,
                (0, external_hooks_1.toWorkflowLifecycleHookActor)(user),
            ]);
        }
        catch (error) {
            throw new workflow_deactivation_bad_request_error_1.WorkflowDeactivationBadRequestError((0, ensure_error_1.ensureError)(error).message, {
                description: (0, utils_1.getErrorDescription)(error),
            });
        }
        await this._teardownActiveVersion(workflow, deactivatedVersionId, user.id);
        workflow.active = false;
        workflow.activeVersionId = null;
        workflow.activeVersion = null;
        this.eventService.emit('workflow-deactivated', {
            user,
            workflowId,
            workflow,
            publicApi,
            deactivatedVersionId,
            source,
        });
        return workflow;
    }
    async deactivateWorkflowAsSystem(workflowId) {
        const workflow = await this.workflowRepository.findOne({
            where: { id: workflowId },
            relations: { activeVersion: true },
        });
        if (!workflow)
            return;
        const deactivatedVersionId = workflow.activeVersionId;
        if (deactivatedVersionId === null)
            return;
        const deactivatedWorkflow = this.workflowRepository.create({
            ...workflow,
            versionId: deactivatedVersionId,
            activeVersion: null,
            nodes: workflow.activeVersion?.nodes ?? workflow.nodes,
            connections: workflow.activeVersion?.connections ?? workflow.connections,
        });
        try {
            await this.externalHooks.run('workflow.deactivate', [
                deactivatedWorkflow,
                this.workflowHookContextService,
            ]);
        }
        catch (error) {
            this.logger.warn('workflow.deactivate hook failed during system deactivation, proceeding', {
                workflowId,
                error: (0, ensure_error_1.ensureError)(error).message,
            });
        }
        await this._teardownActiveVersion(workflow, deactivatedVersionId, null);
    }
    async publishAsSystem(workflowId, versionData, expectedActiveVersionId) {
        const workflow = await this.workflowRepository.findOne({ where: { id: workflowId } });
        if (!workflow?.active ||
            workflow.activeVersionId === null ||
            workflow.activeVersionId !== expectedActiveVersionId) {
            return { published: false, reason: 'superseded' };
        }
        const versionId = (0, uuid_1.v4)();
        try {
            await this.workflowRepository.manager.transaction(async (trx) => {
                await this.workflowHistoryService.saveVersion('n8n', { versionId, ...versionData }, workflowId, false, undefined, trx);
                const recorded = await this._recordPublishInTransaction(trx, null, workflowId, versionId, expectedActiveVersionId, workflow.updatedAt, { onlyIfActiveVersionIs: expectedActiveVersionId });
                if (!recorded)
                    throw new SystemPublishSupersededError();
            });
        }
        catch (error) {
            if (error instanceof SystemPublishSupersededError) {
                return { published: false, reason: 'superseded' };
            }
            throw error;
        }
        this.workflowPublicationNotifier.requestDrain();
        return { published: true, versionId };
    }
    async _teardownActiveVersion(workflow, deactivatedVersionId, userId) {
        const workflowId = workflow.id;
        if (this.globalConfig.workflows.useWorkflowPublicationService) {
            await this._unpublishViaOutbox(userId, workflowId, deactivatedVersionId, workflow.updatedAt);
        }
        else {
            await this.activeWorkflowManager.remove(workflowId);
            await this.workflowRepository.update(workflowId, {
                active: false,
                activeVersionId: null,
                updatedAt: workflow.updatedAt,
            });
            await this.workflowPublishHistoryRepository.addRecord({
                workflowId,
                versionId: deactivatedVersionId,
                event: 'deactivated',
                userId,
            });
        }
    }
    async delete(user, workflowId, force = false, options) {
        await this.externalHooks.run('workflow.delete', [
            workflowId,
            (0, external_hooks_1.toWorkflowLifecycleHookActor)(user),
        ]);
        const workflow = await this.workflowFinderService.findWorkflowForUser(workflowId, user, [
            'workflow:delete',
        ]);
        if (!workflow) {
            return;
        }
        if (this.globalConfig.workflows.useWorkflowPublicationService) {
            if (workflow.activeVersionId !== null) {
                throw new errors_1.ConflictError('Cannot delete a published workflow. Unpublish it before deleting.');
            }
            const pendingPublishedVersionId = await this.workflowPublishedVersionRepository.getPublishedVersionId(workflowId);
            if (pendingPublishedVersionId !== null) {
                throw new errors_1.ConflictError('Workflow is still being unpublished. Please try again in a few moments.');
            }
        }
        if (!workflow.isArchived && !force) {
            throw new errors_1.BadRequestError('Workflow must be archived before it can be deleted.');
        }
        let owningProject;
        try {
            owningProject = await this.sharedWorkflowRepository.getWorkflowOwningProject(workflowId);
        }
        catch (error) {
            this.logger.warn('Failed to resolve the project owning a workflow', { workflowId, error });
        }
        await this.workflowMutationHooks.beforeWorkflowDeleted(workflowId, user.id);
        if (workflow.active) {
            await this.activeWorkflowManager.remove(workflowId);
        }
        await this.executionPersistence.hardDeleteByWorkflowId(workflowId);
        await this.workflowRepository.runInTransaction({}, async (trx, ctx) => {
            await this.durableJobProvisioner.deprovisionOwnerInTransaction(trx, this.workflowScheduledJobOwner.ref(workflowId));
            await this.workflowRepository.removeFromCallerAllowlists([workflowId], ctx);
            await trx.delete(db_1.WorkflowEntity, { id: workflowId });
        });
        await this.ownershipService.invalidateWorkflowProjectCacheByIds([workflowId]);
        await this.workflowMutationHooks.afterWorkflowsDeleted([workflowId]);
        this.eventService.emit('workflow-deleted', {
            user,
            workflowId,
            workflowName: workflow.name,
            projectId: owningProject?.id,
            publicApi: options?.publicApi ?? false,
        });
        await this.externalHooks.run('workflow.afterDelete', [
            workflowId,
            (0, external_hooks_1.toWorkflowLifecycleHookActor)(user),
        ]);
        return workflow;
    }
    async archive(user, workflowId, options) {
        const workflow = await this.workflowFinderService.findWorkflowForUser(workflowId, user, [
            'workflow:delete',
        ]);
        if (!workflow) {
            return;
        }
        if (workflow.isArchived) {
            if (options?.skipArchived) {
                return workflow;
            }
            throw new errors_1.BadRequestError('Workflow is already archived.');
        }
        if (options?.expectedChecksum) {
            await this._detectConflicts(workflow, options.expectedChecksum);
        }
        const activeVersionId = workflow.activeVersionId;
        if (activeVersionId !== null) {
            if (this.globalConfig.workflows.useWorkflowPublicationService) {
                await this._unpublishViaOutbox(user.id, workflowId, activeVersionId, workflow.updatedAt);
            }
            else {
                await this.activeWorkflowManager.remove(workflowId);
                await this.workflowPublishHistoryRepository.addRecord({
                    workflowId,
                    versionId: activeVersionId,
                    event: 'deactivated',
                    userId: user.id,
                });
            }
        }
        const versionId = (0, uuid_1.v4)();
        workflow.versionId = versionId;
        workflow.isArchived = true;
        workflow.active = false;
        workflow.activeVersionId = null;
        workflow.activeVersion = null;
        await this.workflowRepository.update(workflowId, {
            isArchived: true,
            active: false,
            activeVersion: null,
            versionId,
        });
        await this.workflowHistoryService.saveVersion(user, workflow, workflowId);
        await this.workflowMutationHooks.afterWorkflowArchived(workflowId, user.id);
        this.eventService.emit('workflow-archived', {
            user,
            workflowId,
            publicApi: options?.publicApi ?? false,
        });
        await this.externalHooks.run('workflow.afterArchive', [
            workflowId,
            (0, external_hooks_1.toWorkflowLifecycleHookActor)(user),
        ]);
        return workflow;
    }
    async unarchive(user, workflowId, options) {
        const workflow = await this.workflowFinderService.findWorkflowForUser(workflowId, user, [
            'workflow:delete',
        ]);
        if (!workflow) {
            return;
        }
        if (!workflow.isArchived) {
            throw new errors_1.BadRequestError('Workflow is not archived.');
        }
        const versionId = (0, uuid_1.v4)();
        workflow.versionId = versionId;
        workflow.isArchived = false;
        await this.workflowRepository.update(workflowId, { isArchived: false, versionId });
        await this.workflowHistoryService.saveVersion(user, workflow, workflowId);
        this.eventService.emit('workflow-unarchived', {
            user,
            workflowId,
            publicApi: options?.publicApi ?? false,
        });
        await this.externalHooks.run('workflow.afterUnarchive', [
            workflowId,
            (0, external_hooks_1.toWorkflowLifecycleHookActor)(user),
        ]);
        return workflow;
    }
    async archiveForPublicApi(user, workflowId) {
        return await this.archive(user, workflowId, { skipArchived: true, publicApi: true });
    }
    async unarchiveForPublicApi(user, workflowId) {
        return await this.unarchive(user, workflowId, { publicApi: true });
    }
    async deleteForPublicApi(user, workflowId) {
        return await this.delete(user, workflowId, true, { publicApi: true });
    }
    async getWorkflowScopes(user, workflowId) {
        const userProjectRelations = await this.projectService.getProjectRelationsForUser(user);
        const shared = await this.sharedWorkflowRepository.find({
            where: {
                projectId: (0, typeorm_1.In)([...new Set(userProjectRelations.map((pr) => pr.projectId))]),
                workflowId,
            },
        });
        return this.roleService.combineResourceScopes('workflow', user, shared, userProjectRelations);
    }
    async transferAll(fromProjectId, toProjectId, trx) {
        trx = trx ?? this.workflowRepository.manager;
        const allSharedWorkflows = await trx.findBy(db_1.SharedWorkflow, {
            projectId: (0, typeorm_1.In)([fromProjectId, toProjectId]),
        });
        const sharedWorkflowsOfFromProject = allSharedWorkflows.filter((sw) => sw.projectId === fromProjectId);
        const ownedWorkflowIds = sharedWorkflowsOfFromProject
            .filter((sw) => sw.role === 'workflow:owner')
            .map((sw) => sw.workflowId);
        await this.sharedWorkflowRepository.makeOwner(ownedWorkflowIds, toProjectId, trx);
        await this.sharedWorkflowRepository.deleteByIds(ownedWorkflowIds, fromProjectId, trx);
        const sharedWorkflowIdsOfTransferee = allSharedWorkflows
            .filter((sw) => sw.projectId === toProjectId)
            .map((sw) => sw.workflowId);
        const sharedWorkflowsToTransfer = sharedWorkflowsOfFromProject.filter((sw) => sw.role !== 'workflow:owner' && !sharedWorkflowIdsOfTransferee.includes(sw.workflowId));
        await trx.insert(db_1.SharedWorkflow, sharedWorkflowsToTransfer.map((sw) => ({
            workflowId: sw.workflowId,
            projectId: toProjectId,
            role: sw.role,
        })));
        return ownedWorkflowIds;
    }
    async getWorkflowsWithNodesIncluded(user, nodeTypes, includeNodes = false) {
        const foundWorkflows = await this.workflowRepository.findWorkflowsWithNodeType(nodeTypes, includeNodes);
        let { workflows } = await this.workflowRepository.getManyAndCount(foundWorkflows.map((w) => w.id));
        if ((0, requests_1.hasSharing)(workflows)) {
            workflows = await this.processSharedWorkflows(workflows);
        }
        const withScopes = await this.addUserScopes(workflows, user);
        this.cleanupSharedField(withScopes);
        return withScopes.map((workflow) => {
            const nodes = includeNodes
                ? (foundWorkflows.find((w) => w.id === workflow.id)?.nodes ?? [])
                : undefined;
            return { resourceType: 'workflow', ...workflow, ...(includeNodes ? { nodes } : {}) };
        });
    }
    async _detectConflicts(dbWorkflow, expectedChecksum) {
        const currentChecksum = await (0, n8n_workflow_1.calculateWorkflowChecksum)(dbWorkflow);
        if (expectedChecksum !== currentChecksum) {
            throw new errors_1.ConflictError('Your most recent changes may be lost, because someone else just updated this workflow. Open this workflow in a new tab to see those new updates.');
        }
    }
    async _validateNodes(workflowId, nodes, connections) {
        const nodesToValidate = nodes.reduce((acc, node) => {
            acc[node.name] = node;
            return acc;
        }, {});
        const validation = await this.workflowValidationService.validateForActivation(nodesToValidate, connections, this.nodeTypes);
        if (!validation.isValid) {
            this.logger.warn('Workflow activation failed validation', {
                workflowId,
                error: validation.error,
            });
            throw new workflow_validation_error_1.WorkflowValidationError(validation.error ?? 'Workflow validation failed');
        }
    }
    _validateTriggerNodeIds(workflowId, version) {
        const validation = this.workflowValidationService.validateTriggerNodeIds((0, enabled_trigger_nodes_1.getEnabledTriggerNodes)(version, this.nodeTypes));
        if (!validation.isValid) {
            this.logger.warn('Workflow activation failed trigger node id validation', {
                workflowId,
                error: validation.error,
            });
            throw new workflow_validation_error_1.WorkflowValidationError(validation.error ?? 'Trigger node id validation failed');
        }
    }
    async _validateDynamicCredentials(workflowId, nodes, workflowSettings) {
        const validation = await this.workflowValidationService.validateDynamicCredentials(nodes, this.nodeTypes, workflowSettings);
        if (!validation.isValid) {
            this.logger.warn('Workflow activation failed dynamic credentials validation', {
                workflowId,
                error: validation.error,
            });
            throw new workflow_validation_error_1.WorkflowValidationError(validation.error ?? 'Dynamic credentials validation failed');
        }
    }
    async _validatePublisherCredentialAccess(workflowId, user, nodes) {
        const validation = await this.workflowValidationService.validatePublisherCredentialAccess(user, nodes, workflowId);
        if (!validation.isValid) {
            this.logger.warn('Workflow activation failed publisher credential access validation', {
                workflowId,
                userId: user.id,
                error: validation.error,
            });
            throw new workflow_validation_error_1.WorkflowValidationError(validation.error ?? 'Publisher credential access validation failed');
        }
    }
    calculateSettingsChanges(previousSettings, newSettings) {
        const changes = {};
        const prev = previousSettings ?? {};
        const next = newSettings ?? {};
        const allKeys = new Set([...Object.keys(prev), ...Object.keys(next)]);
        for (const key of allKeys) {
            const prevValue = prev[key];
            const nextValue = next[key];
            if (!(0, isEqual_1.default)(prevValue, nextValue)) {
                const from = prevValue ?? null;
                const to = nextValue ?? null;
                changes[key] = { from, to };
            }
        }
        return Object.keys(changes).length > 0 ? changes : undefined;
    }
    async _validateSubWorkflowReferences(workflowId, nodes) {
        const validation = await this.workflowValidationService.validateSubWorkflowReferences(workflowId, nodes);
        if (!validation.isValid) {
            this.logger.warn('Workflow activation failed sub-workflow validation', {
                workflowId,
                error: validation.error,
                invalidReferences: validation.invalidReferences,
            });
            throw new workflow_validation_error_1.WorkflowValidationError(validation.error ?? 'Sub-workflow validation failed');
        }
    }
    async _publishViaOutbox(userId, workflowId, versionIdToActivate, previousActiveVersionId, updatedAt) {
        await this.workflowRepository.manager.transaction(async (trx) => {
            await this._recordPublishInTransaction(trx, userId, workflowId, versionIdToActivate, previousActiveVersionId, updatedAt);
        });
        this.workflowPublicationNotifier.requestDrain();
    }
    async _recordPublishInTransaction(trx, userId, workflowId, versionIdToActivate, previousActiveVersionId, updatedAt, options) {
        const result = await trx.update(db_1.WorkflowEntity, options === undefined
            ? { id: workflowId }
            : { id: workflowId, activeVersionId: options.onlyIfActiveVersionIs }, {
            activeVersionId: versionIdToActivate,
            active: true,
            updatedAt,
        });
        if (options !== undefined && (result.affected ?? 0) === 0) {
            return false;
        }
        if (previousActiveVersionId) {
            await this.workflowPublishHistoryRepository.addRecord({
                workflowId,
                versionId: previousActiveVersionId,
                event: 'deactivated',
                userId,
            }, trx);
        }
        await this.workflowPublishHistoryRepository.addRecord({
            workflowId,
            versionId: versionIdToActivate,
            event: 'activated',
            userId,
        }, trx);
        await this.outboxRepository.enqueue(workflowId, versionIdToActivate, db_1.WorkflowPublicationReason.Publish, trx);
        return true;
    }
    async _unpublishViaOutbox(userId, workflowId, deactivatedVersionId, updatedAt) {
        await this.workflowRepository.manager.transaction(async (trx) => {
            await trx.update(db_1.WorkflowEntity, { id: workflowId }, {
                active: false,
                activeVersionId: null,
                updatedAt,
            });
            await this.workflowPublishHistoryRepository.addRecord({
                workflowId,
                versionId: deactivatedVersionId,
                event: 'deactivated',
                userId,
            }, trx);
            await this.outboxRepository.enqueue(workflowId, deactivatedVersionId, db_1.WorkflowPublicationReason.Publish, trx);
            await this.scheduleTriggerJobRegistrar.removeWorkflowInTransaction(trx, workflowId);
            await this.pollTriggerJobRegistrar.removeWorkflowInTransaction(trx, workflowId);
        });
        this.workflowPublicationNotifier.requestDrain();
    }
    async updateWorkflowTags(user, workflowId, tagIds) {
        const workflow = await this.workflowFinderService.findWorkflowForUser(workflowId, user, [
            'workflow:update',
        ]);
        if (!workflow) {
            throw new errors_1.NotFoundError('Not Found');
        }
        try {
            await this.workflowTagMappingRepository.overwriteTaggings(workflowId, tagIds);
        }
        catch (error) {
            if (error instanceof typeorm_1.QueryFailedError) {
                throw new errors_1.NotFoundError('Some tags not found');
            }
            throw error;
        }
        return await this.tagService.getAllByWorkflowId(workflowId);
    }
};
exports.WorkflowService = WorkflowService;
exports.WorkflowService = WorkflowService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, db_1.SharedWorkflowRepository, db_1.WorkflowRepository, db_1.WorkflowTagMappingRepository, ownership_service_1.OwnershipService, tag_service_1.TagService, workflow_history_service_1.WorkflowHistoryService, external_hooks_1.ExternalHooks, active_workflow_manager_1.ActiveWorkflowManager, backend_services_1.RoleService, project_service_ee_1.ProjectService, execution_persistence_1.ExecutionPersistence, backend_services_1.EventService, config_1.GlobalConfig, db_1.FolderRepository, workflow_finder_service_1.WorkflowFinderService, db_1.WorkflowPublishHistoryRepository, db_1.WorkflowPublicationOutboxRepository, workflow_validation_service_1.WorkflowValidationService, node_types_1.NodeTypes, webhook_service_1.WebhookService, backend_common_1.LicenseState, db_1.ProjectRepository, redaction_enforcement_service_1.RedactionEnforcementService, workflow_publication_notifier_1.WorkflowPublicationNotifier, schedule_trigger_job_registrar_1.ScheduleTriggerJobRegistrar, poll_trigger_job_registrar_1.PollTriggerJobRegistrar, workflow_scheduled_job_owner_1.WorkflowScheduledJobOwner, durable_job_provisioner_1.DurableJobProvisioner, db_1.WorkflowPublishedVersionRepository, workflow_hook_context_service_1.WorkflowHookContextService, backend_services_1.WorkflowPublishGuardProxy, backend_services_1.WorkflowMutationHooksProxy, policy_enforcement_service_1.PolicyEnforcementService, workflow_publication_status_service_1.WorkflowPublicationStatusService, node_group_rules_flag_gate_1.NodeGroupRulesFlagGate, error_workflow_validation_service_1.ErrorWorkflowValidationService, backend_services_1.RestrictedNodeTypesProviderProxy, deprecated_nodes_validation_service_1.DeprecatedNodesValidationService])
], WorkflowService);
//# sourceMappingURL=workflow.service.js.map