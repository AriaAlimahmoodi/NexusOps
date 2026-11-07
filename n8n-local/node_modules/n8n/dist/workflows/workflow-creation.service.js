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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowCreationService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const uuid_1 = require("uuid");
const errors_1 = require("@n8n/errors");
const workflow_validation_error_1 = require("../errors/response-errors/workflow-validation.error");
const uninspectable_subworkflow_source_error_1 = require("../errors/uninspectable-subworkflow-source.error");
const external_hooks_1 = require("../external-hooks");
const generic_helpers_1 = require("../generic-helpers");
const mcp_settings_service_1 = require("../modules/mcp/mcp.settings.service");
const instance_redaction_enforcement_service_1 = require("../modules/redaction/instance-redaction-enforcement.service");
const redaction_policy_1 = require("../modules/redaction/redaction-policy");
const node_types_1 = require("../node-types");
const check_access_1 = require("../permissions.ee/check-access");
const policy_enforcement_service_1 = require("../policy/policy-enforcement.service");
const folder_service_1 = require("../services/folder.service");
const project_service_ee_1 = require("../services/project.service.ee");
const tag_service_1 = require("../services/tag.service");
const WorkflowHelpers = __importStar(require("../workflow-helpers"));
const workflow_hook_context_service_1 = require("../workflow-hook-context.service");
const deprecated_nodes_validation_service_1 = require("./deprecated-nodes-validation.service");
const node_group_rules_flag_gate_1 = require("./node-group-rules-flag-gate");
const utils_1 = require("./utils");
const workflow_finder_service_1 = require("./workflow-finder.service");
const workflow_history_service_1 = require("./workflow-history/workflow-history.service");
const workflow_validation_service_1 = require("./workflow-validation.service");
const workflow_service_ee_1 = require("./workflow.service.ee");
let WorkflowCreationService = class WorkflowCreationService {
    constructor(logger, sharedWorkflowRepository, tagService, workflowHistoryService, externalHooks, projectService, eventService, globalConfig, workflowFinderService, licenseState, projectRepository, tagRepository, credentialsFinderService, folderService, enterpriseWorkflowService, nodeTypes, workflowValidationService, instanceRedactionEnforcementService, workflowHookContextService, mcpSettingsService, policyEnforcementService, workflowRepository, nodeGroupRulesFlagGate, deprecatedNodesValidationService) {
        this.logger = logger;
        this.sharedWorkflowRepository = sharedWorkflowRepository;
        this.tagService = tagService;
        this.workflowHistoryService = workflowHistoryService;
        this.externalHooks = externalHooks;
        this.projectService = projectService;
        this.eventService = eventService;
        this.globalConfig = globalConfig;
        this.workflowFinderService = workflowFinderService;
        this.licenseState = licenseState;
        this.projectRepository = projectRepository;
        this.tagRepository = tagRepository;
        this.credentialsFinderService = credentialsFinderService;
        this.folderService = folderService;
        this.enterpriseWorkflowService = enterpriseWorkflowService;
        this.nodeTypes = nodeTypes;
        this.workflowValidationService = workflowValidationService;
        this.instanceRedactionEnforcementService = instanceRedactionEnforcementService;
        this.workflowHookContextService = workflowHookContextService;
        this.mcpSettingsService = mcpSettingsService;
        this.policyEnforcementService = policyEnforcementService;
        this.workflowRepository = workflowRepository;
        this.nodeGroupRulesFlagGate = nodeGroupRulesFlagGate;
        this.deprecatedNodesValidationService = deprecatedNodesValidationService;
    }
    async prepareBatchContext(user, projectId, parentFolderIds, workflows, credentialBindings) {
        const project = await this.projectService.getProjectWithScope(user, projectId, [
            'workflow:create',
        ]);
        if (!project) {
            if (!(await this.projectRepository.exists({ where: { id: projectId } }))) {
                throw new errors_1.NotFoundError('Project not found');
            }
            throw new errors_1.ForbiddenError("You don't have the permissions to save the workflow in this project.");
        }
        const uniqueFolderIds = [...new Set(parentFolderIds)].filter((id) => id !== n8n_workflow_1.PROJECT_ROOT);
        const folders = await this.folderService.getFoldersByIds(uniqueFolderIds);
        const parentFolders = new Map(folders
            .filter((folder) => folder.homeProject.id === projectId)
            .map((folder) => [folder.id, folder]));
        const missingFolderId = uniqueFolderIds.find((id) => !parentFolders.has(id));
        if (missingFolderId) {
            throw new errors_1.NotFoundError(`Could not find the folder: ${missingFolderId}`);
        }
        const referencedCredentialIds = new Set();
        for (const workflow of workflows) {
            const { ids } = this.enterpriseWorkflowService.collectCredentialReferences(workflow);
            for (const id of ids)
                referencedCredentialIds.add(credentialBindings.get(id) ?? id);
        }
        const validatedCredentialIds = new Set(credentialBindings.values());
        const credentialIdsToCheck = [...referencedCredentialIds].filter((id) => !validatedCredentialIds.has(id));
        const [redactionFloor, autoExposeNewWorkflows, accessibleCredentialIds] = await Promise.all([
            this.readActiveRedactionFloor(),
            this.readAutoExposeNewWorkflows(),
            this.credentialsFinderService.findCredentialIdsWithScopeForUser(credentialIdsToCheck, user, [
                'credential:read',
            ]),
        ]);
        const allowedCredentialIds = new Set([...validatedCredentialIds, ...accessibleCredentialIds]);
        return {
            project,
            allowedCredentialIds,
            checkedCredentialIds: new Set([...validatedCredentialIds, ...referencedCredentialIds]),
            credentialResolutionCache: new Map(),
            redactionFloor,
            autoExposeNewWorkflows,
        };
    }
    async createWorkflow(user, newWorkflow, options = {}) {
        const { tagIds, parentFolderId, projectId, sourceWorkflowId, autosaved = false, uiContext, publicApi = false, source = 'ui', versionName, versionDescription, batchContext, } = options;
        newWorkflow.active = false;
        newWorkflow.versionId = (0, uuid_1.v4)();
        newWorkflow.parentFolder = null;
        newWorkflow.sourceWorkflowId = sourceWorkflowId ?? null;
        await (0, generic_helpers_1.validateEntity)(newWorkflow);
        if (tagIds?.length && !this.globalConfig.tags.disabled) {
            newWorkflow.tags = await this.tagRepository.findMany(tagIds);
        }
        const effectiveProjectId = batchContext?.project.id ??
            projectId ??
            (await this.projectRepository.getPersonalProjectForUserOrFail(user.id)).id;
        let project = batchContext?.project ??
            (await this.projectService.getProjectWithScope(user, effectiveProjectId, [
                'workflow:create',
            ]));
        if (!project) {
            if (!(await this.projectRepository.exists({ where: { id: effectiveProjectId } }))) {
                throw new errors_1.NotFoundError('Project not found');
            }
            const message = "You don't have the permissions to save the workflow in this project.";
            if (publicApi) {
                throw new errors_1.ForbiddenError(message);
            }
            throw new errors_1.BadRequestError(message);
        }
        await WorkflowHelpers.replaceInvalidCredentials(newWorkflow, effectiveProjectId, batchContext?.credentialResolutionCache);
        WorkflowHelpers.addNodeIds(newWorkflow);
        WorkflowHelpers.resolveNodeWebhookIds(newWorkflow, this.nodeTypes);
        WorkflowHelpers.validateWorkflowStructure(newWorkflow);
        const rules = newWorkflow.nodeGroups?.length
            ? await this.nodeGroupRulesFlagGate.getEnabledRules(user)
            : {};
        WorkflowHelpers.validateWorkflowNodeGroups(newWorkflow, WorkflowHelpers.makeGetNodeTypeForGrouping(this.nodeTypes), rules);
        this.deprecatedNodesValidationService.validateOnCreate(newWorkflow.nodes, newWorkflow.id);
        if (parentFolderId && parentFolderId !== n8n_workflow_1.PROJECT_ROOT) {
            if (!batchContext) {
                await this.findParentFolderInProjectOrFail(parentFolderId, effectiveProjectId);
            }
        }
        if ('pinData' in newWorkflow) {
            WorkflowHelpers.validatePinDataSize(newWorkflow);
        }
        if (this.licenseState.isSharingLicensed()) {
            const { ids: credentialIds, hasUnresolved, hasUninspectableSource, } = this.enterpriseWorkflowService.collectCredentialReferences(newWorkflow);
            if (batchContext) {
                const uncheckedIds = [...credentialIds].filter((id) => !batchContext.checkedCredentialIds.has(id));
                if (uncheckedIds.length > 0) {
                    const accessibleIds = await this.credentialsFinderService.findCredentialIdsWithScopeForUser(uncheckedIds, user, ['credential:read']);
                    for (const id of uncheckedIds)
                        batchContext.checkedCredentialIds.add(id);
                    for (const id of accessibleIds)
                        batchContext.allowedCredentialIds.add(id);
                }
            }
            const accessibleCredentialIds = batchContext?.allowedCredentialIds ??
                (credentialIds.size === 0
                    ? new Set()
                    : await this.credentialsFinderService.findCredentialIdsWithScopeForUser([...credentialIds], user, ['credential:read']));
            try {
                this.enterpriseWorkflowService.validateCredentialPermissionsToUser(newWorkflow, hasUnresolved ? new Set() : accessibleCredentialIds, {
                    allowUninspectableSource: hasUninspectableSource && this.enterpriseWorkflowService.canUseEveryCredential(user),
                });
            }
            catch (error) {
                if (error instanceof uninspectable_subworkflow_source_error_1.UninspectableSubworkflowSourceError) {
                    throw new errors_1.BadRequestError(error.message);
                }
                throw new errors_1.BadRequestError('The workflow you are trying to save contains credentials that are not shared with you');
            }
        }
        const restrictionValidation = this.workflowValidationService.validateCredentialNodeRestrictions(newWorkflow.nodes);
        if (!restrictionValidation.isValid) {
            throw new workflow_validation_error_1.WorkflowValidationError(restrictionValidation.error ?? 'Credential binding is not allowed.');
        }
        await this.externalHooks.run('workflow.create', [
            newWorkflow,
            this.workflowHookContextService,
            (0, external_hooks_1.toWorkflowLifecycleHookActor)(user),
        ]);
        const cleared = await this.policyEnforcementService.enforceWorkflowSave({
            workflow: { id: newWorkflow.id ?? null, name: newWorkflow.name, nodes: newWorkflow.nodes },
            storedWorkflow: null,
            projectId: effectiveProjectId,
        }, { kind: 'user', user });
        const floor = batchContext?.redactionFloor ?? (await this.readActiveRedactionFloor());
        const savedWorkflow = await this.workflowRepository.runInTransaction({ policyCleared: cleared }, async (transactionManager, ctx) => {
            project = await this.projectService.getProjectWithScope(user, effectiveProjectId, ['workflow:create'], transactionManager);
            if (project === null) {
                const message = "You don't have the permissions to save the workflow in this project.";
                if (publicApi) {
                    throw new errors_1.ForbiddenError(message);
                }
                throw new errors_1.BadRequestError(message);
            }
            await this.resolveRedactionPolicyOnCreate(newWorkflow, user, effectiveProjectId, transactionManager, floor);
            await this.resolveMcpExposureOnCreate(newWorkflow, transactionManager, batchContext?.autoExposeNewWorkflows);
            if (parentFolderId && parentFolderId !== n8n_workflow_1.PROJECT_ROOT) {
                newWorkflow.parentFolder = await this.findParentFolderInProjectOrFail(parentFolderId, project.id, transactionManager);
            }
            const workflow = await this.workflowRepository.createContent(newWorkflow, ctx);
            const newSharedWorkflow = this.sharedWorkflowRepository.create({
                role: 'workflow:owner',
                projectId: project.id,
                workflow,
            });
            await transactionManager.save(newSharedWorkflow);
            await this.workflowHistoryService.saveVersion(user, workflow, workflow.id, autosaved, source, transactionManager, versionName || versionDescription
                ? { name: versionName, description: versionDescription }
                : undefined);
            return await this.workflowFinderService.findWorkflowForUser(workflow.id, user, ['workflow:read'], {
                em: transactionManager,
                includeTags: true,
                includeParentFolder: true,
                includeActiveVersion: true,
            });
        });
        if (!savedWorkflow) {
            this.logger.error('Failed to create workflow', { userId: user.id });
            throw new errors_1.InternalServerError('Failed to save workflow');
        }
        if (tagIds && !this.globalConfig.tags.disabled && savedWorkflow.tags) {
            savedWorkflow.tags = this.tagService.sortByRequestOrder(savedWorkflow.tags, {
                requestOrder: tagIds,
            });
        }
        await this.externalHooks.run('workflow.afterCreate', [
            savedWorkflow,
            this.workflowHookContextService,
            (0, external_hooks_1.toWorkflowLifecycleHookActor)(user),
        ]);
        this.eventService.emit('workflow-created', {
            user,
            workflow: newWorkflow,
            publicApi,
            projectId: project.id,
            projectType: project.type,
            uiContext,
            source,
        });
        return savedWorkflow;
    }
    async findParentFolderInProjectOrFail(parentFolderId, projectId, em) {
        try {
            return await this.folderService.findFolderInProjectOrFail(parentFolderId, projectId, em);
        }
        catch {
            throw new errors_1.NotFoundError(`Could not find the folder: ${parentFolderId}`);
        }
    }
    async readActiveRedactionFloor() {
        if (!this.licenseState.isDataRedactionLicensed())
            return 'off';
        return await this.instanceRedactionEnforcementService.get();
    }
    async readAutoExposeNewWorkflows() {
        try {
            return await this.mcpSettingsService.getAutoExposeNewWorkflows();
        }
        catch (error) {
            this.logger.warn('Failed to resolve auto-expose setting for new workflow', {
                cause: error instanceof Error ? error.message : String(error),
            });
            return false;
        }
    }
    async resolveRedactionPolicyOnCreate(newWorkflow, user, effectiveProjectId, transactionManager, floor) {
        if (!this.licenseState.isDataRedactionLicensed()) {
            (0, utils_1.dropRedactionPolicy)(newWorkflow);
            return;
        }
        const incomingPolicy = newWorkflow.settings?.redactionPolicy;
        const hasIncoming = incomingPolicy !== undefined && incomingPolicy !== 'none';
        if (!hasIncoming && floor === 'off')
            return;
        const canUpdateRedaction = await (0, check_access_1.userHasScopes)(user, ['workflow:enableRedaction'], false, { projectId: effectiveProjectId }, transactionManager);
        if (!canUpdateRedaction && hasIncoming) {
            (0, utils_1.dropRedactionPolicy)(newWorkflow);
        }
        if (floor === 'off' || !canUpdateRedaction)
            return;
        const current = newWorkflow.settings?.redactionPolicy;
        if (current !== undefined && (0, redaction_policy_1.policyMeetsFloor)(current, floor))
            return;
        const seed = (0, redaction_policy_1.policyForFloor)(floor);
        if (seed === undefined)
            return;
        newWorkflow.settings = { ...(newWorkflow.settings ?? {}), redactionPolicy: seed };
    }
    async resolveMcpExposureOnCreate(newWorkflow, transactionManager, autoExposeNewWorkflows) {
        if (newWorkflow.settings?.availableInMCP !== undefined)
            return;
        if (autoExposeNewWorkflows !== undefined) {
            if (!autoExposeNewWorkflows)
                return;
            newWorkflow.settings = { ...(newWorkflow.settings ?? {}), availableInMCP: true };
            return;
        }
        try {
            if (!(await this.mcpSettingsService.getAutoExposeNewWorkflows(transactionManager)))
                return;
        }
        catch (error) {
            this.logger.warn('Failed to resolve auto-expose setting for new workflow', {
                cause: error instanceof Error ? error.message : String(error),
            });
            return;
        }
        newWorkflow.settings = { ...(newWorkflow.settings ?? {}), availableInMCP: true };
    }
};
exports.WorkflowCreationService = WorkflowCreationService;
exports.WorkflowCreationService = WorkflowCreationService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, db_1.SharedWorkflowRepository, tag_service_1.TagService, workflow_history_service_1.WorkflowHistoryService, external_hooks_1.ExternalHooks, project_service_ee_1.ProjectService, backend_services_1.EventService, config_1.GlobalConfig, workflow_finder_service_1.WorkflowFinderService, backend_common_1.LicenseState, db_1.ProjectRepository, db_1.TagRepository, backend_services_1.CredentialsFinderService, folder_service_1.FolderService, workflow_service_ee_1.EnterpriseWorkflowService, node_types_1.NodeTypes, workflow_validation_service_1.WorkflowValidationService, instance_redaction_enforcement_service_1.InstanceRedactionEnforcementService, workflow_hook_context_service_1.WorkflowHookContextService, mcp_settings_service_1.McpSettingsService, policy_enforcement_service_1.PolicyEnforcementService, db_1.WorkflowRepository, node_group_rules_flag_gate_1.NodeGroupRulesFlagGate, deprecated_nodes_validation_service_1.DeprecatedNodesValidationService])
], WorkflowCreationService);
//# sourceMappingURL=workflow-creation.service.js.map