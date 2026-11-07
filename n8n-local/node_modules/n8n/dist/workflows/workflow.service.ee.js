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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnterpriseWorkflowService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const permissions_1 = require("@n8n/permissions");
const is_record_1 = require("@n8n/utils/is-record");
const typeorm_1 = require("@n8n/typeorm");
const isEqual_1 = __importDefault(require("lodash/isEqual"));
const omit_1 = __importDefault(require("lodash/omit"));
const n8n_workflow_1 = require("n8n-workflow");
const active_workflow_manager_1 = require("../active-workflow-manager");
const credential_sharing_1 = require("../constants/credential-sharing");
const backend_services_1 = require("@n8n/backend-services");
const credentials_service_1 = require("../credentials/credentials.service");
const credentials_service_ee_1 = require("../credentials/credentials.service.ee");
const credentials_permission_checker_1 = require("../executions/pre-execution-checks/credentials-permission-checker");
const folder_not_found_error_1 = require("../errors/folder-not-found.error");
const errors_1 = require("@n8n/errors");
const transfer_workflow_error_1 = require("../errors/response-errors/transfer-workflow.error");
const uninspectable_subworkflow_source_error_1 = require("../errors/uninspectable-subworkflow-source.error");
const extract_agent_credential_ids_1 = require("../modules/agents/utils/extract-agent-credential-ids");
const node_types_1 = require("../node-types");
const policy_enforcement_service_1 = require("../policy/policy-enforcement.service");
const ownership_service_1 = require("../services/ownership.service");
const project_service_ee_1 = require("../services/project.service.ee");
const utils_1 = require("../utils");
const workflow_finder_service_1 = require("./workflow-finder.service");
const INSPECTABLE_SUBWORKFLOW_SOURCES = new Set(['database', 'parameter']);
const FREELY_EDITABLE_NODE_FIELDS = ['name', 'position', 'disabled', 'color', 'issues', 'status'];
function isWorkflowSelectorNode(node) {
    if (typeof node.type !== 'string')
        return false;
    return (0, n8n_workflow_1.isNodeWithWorkflowSelector)({ ...node, type: (0, utils_1.stripToolSuffix)(node.type) });
}
const EDITABLE_NODE_FIELDS = ['name', 'position', 'disabled'];
const HISTORY_LOOKBACK_LIMIT = 20;
let EnterpriseWorkflowService = class EnterpriseWorkflowService {
    constructor(logger, sharedWorkflowRepository, workflowRepository, credentialsRepository, credentialsService, ownershipService, projectService, activeWorkflowManager, credentialsFinderService, enterpriseCredentialsService, workflowFinderService, folderRepository, workflowPublishHistoryRepository, workflowMutationHooks, policyEnforcementService, nodeTypes, credentialsPermissionChecker, workflowHistoryRepository) {
        this.logger = logger;
        this.sharedWorkflowRepository = sharedWorkflowRepository;
        this.workflowRepository = workflowRepository;
        this.credentialsRepository = credentialsRepository;
        this.credentialsService = credentialsService;
        this.ownershipService = ownershipService;
        this.projectService = projectService;
        this.activeWorkflowManager = activeWorkflowManager;
        this.credentialsFinderService = credentialsFinderService;
        this.enterpriseCredentialsService = enterpriseCredentialsService;
        this.workflowFinderService = workflowFinderService;
        this.folderRepository = folderRepository;
        this.workflowPublishHistoryRepository = workflowPublishHistoryRepository;
        this.workflowMutationHooks = workflowMutationHooks;
        this.policyEnforcementService = policyEnforcementService;
        this.nodeTypes = nodeTypes;
        this.credentialsPermissionChecker = credentialsPermissionChecker;
        this.workflowHistoryRepository = workflowHistoryRepository;
    }
    async shareWithProjects(workflowId, shareWithIds, entityManager) {
        const em = entityManager ?? this.sharedWorkflowRepository.manager;
        let projects = await em.find(db_1.Project, {
            where: { id: (0, typeorm_1.In)(shareWithIds), type: 'personal' },
            relations: { sharedWorkflows: true },
        });
        projects = projects.filter((p) => !p.sharedWorkflows.some((swf) => swf.workflowId === workflowId && swf.role === 'workflow:owner'));
        const newSharedWorkflows = projects
            .map((project) => this.sharedWorkflowRepository.create({
            workflowId,
            role: 'workflow:editor',
            projectId: project.id,
        }));
        return await em.save(newSharedWorkflows);
    }
    addOwnerAndSharings(workflow) {
        const workflowWithMetaData = this.ownershipService.addOwnedByAndSharedWith(workflow);
        return {
            ...workflow,
            ...workflowWithMetaData,
            usedCredentials: workflow.usedCredentials ?? [],
        };
    }
    async addCredentialsToWorkflow(workflow, currentUser) {
        workflow.usedCredentials = [];
        const credentialIdsUsedByWorkflow = new Set();
        workflow.nodes.forEach((node) => {
            if (!node.credentials) {
                return;
            }
            Object.keys(node.credentials).forEach((credentialType) => {
                const credential = node.credentials?.[credentialType];
                if (!credential?.id) {
                    return;
                }
                credentialIdsUsedByWorkflow.add(credential.id);
            });
        });
        const credentialIds = Array.from(credentialIdsUsedByWorkflow);
        const workflowCredentials = await this.credentialsRepository.getManyByIds(credentialIds, {
            withSharings: true,
        });
        const usableCredentialIds = await this.findUsableCredentialIds(currentUser, credentialIds, workflow.id);
        workflowCredentials.forEach((credential) => {
            const credentialId = credential.id;
            const filledCred = this.ownershipService.addOwnedByAndSharedWith(credential);
            workflow.usedCredentials?.push({
                id: credentialId,
                name: credential.name,
                type: credential.type,
                currentUserCanUse: usableCredentialIds.has(credentialId),
                homeProject: filledCred.homeProject,
                sharedWithProjects: filledCred.sharedWithProjects,
            });
        });
    }
    async findUsableCredentialIds(user, credentialIds, workflowId) {
        if (credentialIds.length === 0)
            return new Set();
        if ((0, credential_sharing_1.isCredSharingEnabled)()) {
            const unusable = await this.credentialsPermissionChecker.findUnusableInWorkflow(workflowId, credentialIds, user.id);
            const unusableIds = new Set(unusable.map((c) => c.id));
            return new Set(credentialIds.filter((id) => !unusableIds.has(id)));
        }
        const userCredentials = await this.credentialsService.getCredentialsAUserCanUseInAWorkflow(user, { workflowId });
        return new Set(userCredentials.map((credential) => credential.id));
    }
    validateCredentialPermissionsToUser(workflow, allowedCredentials, options = {}) {
        const allowedCredentialIds = Array.isArray(allowedCredentials)
            ? new Set(allowedCredentials.map(({ id }) => id))
            : allowedCredentials;
        const inaccessibleNodes = this.getNodesWithInaccessibleCreds(workflow, allowedCredentialIds, options);
        if (inaccessibleNodes.length > 0) {
            const uninspectableNode = inaccessibleNodes.find((node) => this.isBlockedByUninspectableSource(node, options));
            if (uninspectableNode)
                throw new uninspectable_subworkflow_source_error_1.UninspectableSubworkflowSourceError(uninspectableNode);
            throw new n8n_workflow_1.UserError('The workflow contains credentials that you do not have access to');
        }
    }
    async preventTampering(workflow, workflowId, user, restoredNodes = []) {
        const previousVersion = await this.workflowRepository.get({ id: workflowId });
        if (!previousVersion) {
            throw new errors_1.NotFoundError('Workflow not found');
        }
        const allCredentials = await this.credentialsService.getCredentialsAUserCanUseInAWorkflow(user, { workflowId });
        const options = { allowUninspectableSource: this.canUseEveryCredential(user) };
        const historyNodes = [
            ...restoredNodes,
            ...(await this.findNodesAsHistoryStoredThem(workflow, previousVersion, allCredentials, restoredNodes, options, workflowId)),
        ];
        try {
            return this.validateWorkflowCredentialUsage(workflow, previousVersion, allCredentials, historyNodes, options);
        }
        catch (error) {
            if (error instanceof n8n_workflow_1.NodeOperationError) {
                throw new errors_1.BadRequestError(error.message);
            }
            throw new errors_1.BadRequestError('Invalid workflow credentials - make sure you have access to all credentials and try again.');
        }
    }
    async findNodesAsHistoryStoredThem(workflow, previousVersion, credentialsUserHasAccessTo, restoredNodes, options, workflowId) {
        const allowedCredentialIds = credentialsUserHasAccessTo.map((cred) => cred.id);
        const settledNodeIds = new Set([
            ...this.getNodesWithInaccessibleCreds(previousVersion, allowedCredentialIds, options).map((node) => node.id),
            ...restoredNodes.map((node) => node.id),
        ]);
        const allowed = new Set(allowedCredentialIds);
        const candidates = this.getNodesWithInaccessibleCreds(workflow, allowedCredentialIds, options).filter((node) => {
            if (!node.id || settledNodeIds.has(node.id))
                return false;
            const { ids, hasUnresolved } = this.getNodeCredentialRefs(node);
            return hasUnresolved || ids.some((id) => !allowed.has(id));
        });
        if (candidates.length === 0)
            return [];
        const versions = await this.workflowHistoryRepository.findNewestVersionNodes(workflowId, HISTORY_LOOKBACK_LIMIT);
        const storedNodes = versions.flatMap((version) => version.nodes);
        return candidates.flatMap((candidate) => {
            const stored = storedNodes.find((node) => node.id === candidate.id && this.isSameNodeApartFromEditableFields(node, candidate));
            return stored ? [stored] : [];
        });
    }
    isSameNodeApartFromEditableFields(a, b) {
        return (0, isEqual_1.default)(this.toComparableNode(a), this.toComparableNode(b));
    }
    toComparableNode(node) {
        const { credentials, ...rest } = (0, omit_1.default)(node, EDITABLE_NODE_FIELDS);
        if (!credentials)
            return rest;
        const credentialIdentities = Object.fromEntries(Object.entries(credentials).map(([type, credential]) => [
            type,
            credential?.id ?? credential?.name ?? null,
        ]));
        return { ...rest, credentials: credentialIdentities };
    }
    validateWorkflowCredentialUsage(newWorkflowVersion, previousWorkflowVersion, credentialsUserHasAccessTo, historyNodes = [], options = {}) {
        const allowedCredentialIds = credentialsUserHasAccessTo.map((cred) => cred.id);
        const nodesWithCredentialsUserDoesNotHaveAccessTo = new Set(this.getNodesWithInaccessibleCreds(newWorkflowVersion, allowedCredentialIds, options));
        if (nodesWithCredentialsUserDoesNotHaveAccessTo.size === 0) {
            return newWorkflowVersion;
        }
        const readOnlyNodeIds = new Set(this.getNodesWithInaccessibleCreds(previousWorkflowVersion, allowedCredentialIds, options).map((node) => node.id));
        const previousNodesById = new Map();
        for (const node of previousWorkflowVersion.nodes) {
            if (!previousNodesById.has(node.id))
                previousNodesById.set(node.id, node);
        }
        const submittedIdCounts = new Map();
        for (const node of newWorkflowVersion.nodes) {
            submittedIdCounts.set(node.id, (submittedIdCounts.get(node.id) ?? 0) + 1);
        }
        const historyNodesById = new Map();
        for (const node of historyNodes) {
            if (!historyNodesById.has(node.id))
                historyNodesById.set(node.id, node);
        }
        newWorkflowVersion.nodes = newWorkflowVersion.nodes.map((node) => {
            if (!nodesWithCredentialsUserDoesNotHaveAccessTo.has(node))
                return node;
            const previousNode = previousNodesById.get(node.id);
            const idClaimedOnce = submittedIdCounts.get(node.id) === 1;
            const blockedBySource = this.isBlockedByUninspectableSource(node, options);
            const historyNode = historyNodesById.get(node.id);
            if (idClaimedOnce &&
                historyNode &&
                this.isSameNodeApartFromEditableFields(historyNode, node)) {
                return node;
            }
            if (!previousNode || !idClaimedOnce || !readOnlyNodeIds.has(node.id)) {
                this.logger.warn('Blocked workflow update due to tampering attempt', {
                    nodeType: node.type,
                    nodeName: node.name,
                    nodeId: node.id,
                    nodeCredentials: node.credentials,
                });
                if (blockedBySource)
                    throw new uninspectable_subworkflow_source_error_1.UninspectableSubworkflowSourceError(node);
                throw new n8n_workflow_1.NodeOperationError(node, `You don't have access to the credentials in the '${node.name}' node. Ask the owner to share them with you.`);
            }
            if (blockedBySource &&
                !(0, isEqual_1.default)(this.getNodeDefinition(node), this.getNodeDefinition(previousNode))) {
                throw new uninspectable_subworkflow_source_error_1.UninspectableSubworkflowSourceError(node);
            }
            this.logger.debug('Replacing node with previous version when saving updated workflow', {
                nodeType: node.type,
                nodeName: node.name,
                nodeId: node.id,
            });
            const restoredNode = { ...previousNode };
            if ('name' in node)
                restoredNode.name = node.name;
            if ('position' in node)
                restoredNode.position = node.position;
            if ('disabled' in node)
                restoredNode.disabled = node.disabled;
            else
                delete restoredNode.disabled;
            return restoredNode;
        });
        return newWorkflowVersion;
    }
    getNodesWithInaccessibleCreds(workflow, userCredIds, options = {}) {
        if (!workflow.nodes) {
            return [];
        }
        const allowedCredentialIds = userCredIds instanceof Set ? userCredIds : new Set(userCredIds);
        return workflow.nodes.filter((node) => {
            const { ids, hasUnresolved, hasUninspectableSource } = this.getNodeCredentialRefs(node);
            return (hasUnresolved ||
                (hasUninspectableSource && !options.allowUninspectableSource) ||
                ids.some((credId) => !allowedCredentialIds.has(credId)));
        });
    }
    collectCredentialReferences(workflow) {
        const ids = new Set();
        let hasUnresolved = false;
        let hasUninspectableSource = false;
        for (const node of workflow.nodes ?? []) {
            const references = this.getNodeCredentialRefs(node);
            for (const id of references.ids)
                ids.add(id);
            hasUnresolved ||= references.hasUnresolved;
            hasUninspectableSource ||= references.hasUninspectableSource;
        }
        return { ids, hasUnresolved, hasUninspectableSource };
    }
    canUseEveryCredential(user) {
        return (0, permissions_1.hasGlobalScope)(user, 'credential:use');
    }
    isBlockedByUninspectableSource(node, options) {
        if (options.allowUninspectableSource)
            return false;
        return this.getNodeCredentialRefs(node).hasUninspectableSource;
    }
    getNodeDefinition(node) {
        const definition = (0, omit_1.default)(node, FREELY_EDITABLE_NODE_FIELDS);
        definition.parameters = this.getDisplayedParameters(node);
        const credentials = node.credentials ?? {};
        if (Object.keys(credentials).length === 0)
            delete definition.credentials;
        if (!node.continueOnFail)
            delete definition.continueOnFail;
        if (!node.onError || node.onError === 'stopWorkflow')
            delete definition.onError;
        if (!node.notes)
            delete definition.notes;
        return definition;
    }
    getDisplayedParameters(node) {
        const parameters = node.parameters ?? {};
        const description = this.getNodeTypeDescription(node);
        if (!description)
            return parameters;
        return (n8n_workflow_1.NodeHelpers.getNodeParameters(description.properties, parameters, true, false, node, description) ?? {});
    }
    getNodeTypeDescription(node) {
        try {
            return this.nodeTypes.getByNameAndVersion(node.type, node.typeVersion)?.description ?? null;
        }
        catch {
            return null;
        }
    }
    hasUninspectableSubworkflowSource(node) {
        const source = node.parameters?.source;
        if (source === undefined)
            return false;
        if (!(typeof source === 'string' && INSPECTABLE_SUBWORKFLOW_SOURCES.has(source)))
            return true;
        if (source !== 'parameter')
            return false;
        const workflowJson = node.parameters?.workflowJson;
        const isFixedText = workflowJson === undefined ||
            (typeof workflowJson === 'string' && !(0, n8n_workflow_1.isExpression)(workflowJson));
        return !isFixedText;
    }
    getNodeCredentialRefs(node) {
        const ids = [];
        let hasUnresolved = false;
        let hasUninspectableSource = false;
        const stack = [node];
        while (stack.length > 0) {
            const current = stack.pop();
            if (current.credentials) {
                for (const nodeCred of Object.values(current.credentials)) {
                    const id = nodeCred.id?.toString();
                    if (id) {
                        ids.push(id);
                    }
                    else if (nodeCred.__aiGatewayManaged && nodeCred.id === null) {
                    }
                    else if (nodeCred.id === null || nodeCred.id === '') {
                        hasUnresolved = true;
                    }
                }
            }
            if (isWorkflowSelectorNode(current)) {
                hasUninspectableSource ||= this.hasUninspectableSubworkflowSource(current);
                stack.push(...this.getInlineWorkflowNodes(current.parameters?.workflowJson));
            }
            const inlineAgent = this.parseInlineAgent(current.parameters?.inlineAgent);
            if ((0, is_record_1.isRecord)(inlineAgent)) {
                ids.push(...(0, extract_agent_credential_ids_1.extractAgentCredentialIds)(inlineAgent.config));
                stack.push(...this.getAgentToolNodes(inlineAgent));
            }
        }
        return { ids, hasUnresolved, hasUninspectableSource };
    }
    parseInlineAgent(inlineAgent) {
        return typeof inlineAgent === 'string'
            ? (0, n8n_workflow_1.jsonParse)(inlineAgent, { fallbackValue: null })
            : inlineAgent;
    }
    getAgentToolNodes(config) {
        if (Array.isArray(config))
            return config.flatMap((entry) => this.getAgentToolNodes(entry));
        if (!(0, is_record_1.isRecord)(config))
            return [];
        const nested = Object.values(config).flatMap((value) => this.getAgentToolNodes(value));
        if (typeof config.nodeType !== 'string')
            return nested;
        const type = (0, utils_1.stripToolSuffix)(config.nodeType);
        const parameters = (0, is_record_1.isRecord)(config.nodeParameters) ? config.nodeParameters : {};
        return [...nested, { type, parameters }];
    }
    getInlineWorkflowNodes(workflowJson) {
        if (typeof workflowJson !== 'string')
            return [];
        let parsed;
        try {
            parsed = (0, n8n_workflow_1.jsonParse)(workflowJson);
        }
        catch {
            return [];
        }
        if (!parsed || !Array.isArray(parsed.nodes))
            return [];
        return parsed.nodes.filter((subNode) => Boolean(subNode));
    }
    async getWorkflowIdsWithResolvableCredentials(workflowIds) {
        if (workflowIds.length === 0) {
            return new Set();
        }
        const workflows = await this.workflowRepository.findByIds(workflowIds, {
            fields: ['id', 'nodes'],
        });
        const credentialIdToWorkflowIds = new Map();
        for (const workflow of workflows) {
            if (!workflow.nodes)
                continue;
            for (const node of workflow.nodes) {
                if (!node.credentials)
                    continue;
                for (const credentialType of Object.keys(node.credentials)) {
                    const credentialId = node.credentials[credentialType]?.id;
                    if (credentialId) {
                        const workflowIdsList = credentialIdToWorkflowIds.get(credentialId) ?? [];
                        workflowIdsList.push(workflow.id);
                        credentialIdToWorkflowIds.set(credentialId, workflowIdsList);
                    }
                }
            }
        }
        if (credentialIdToWorkflowIds.size === 0) {
            return new Set();
        }
        const resolvableCredentials = await this.credentialsRepository.find({
            where: {
                id: (0, typeorm_1.In)(Array.from(credentialIdToWorkflowIds.keys())),
                isResolvable: true,
                usageScope: 'project',
            },
            select: ['id'],
        });
        const workflowIdsWithResolvableCredentials = new Set();
        for (const credential of resolvableCredentials) {
            const workflowIdsList = credentialIdToWorkflowIds.get(credential.id);
            if (workflowIdsList) {
                for (const workflowId of workflowIdsList) {
                    workflowIdsWithResolvableCredentials.add(workflowId);
                }
            }
        }
        return workflowIdsWithResolvableCredentials;
    }
    async transferWorkflow(user, workflowId, destinationProjectId, shareCredentials = [], destinationParentFolderId) {
        const workflow = await this.workflowFinderService.findWorkflowForUser(workflowId, user, ['workflow:move'], {
            includeParentFolder: true,
        });
        errors_1.NotFoundError.isDefinedAndNotNull(workflow, `Could not find workflow with the id "${workflowId}". Make sure you have the permission to move it.`);
        const ownerSharing = workflow.shared.find((s) => s.role === 'workflow:owner');
        errors_1.NotFoundError.isDefinedAndNotNull(ownerSharing, `Could not find owner for workflow "${workflow.id}"`);
        const sourceProject = ownerSharing.project;
        const destinationProject = await this.projectService.getProjectWithScope(user, destinationProjectId, ['workflow:create']);
        errors_1.NotFoundError.isDefinedAndNotNull(destinationProject, `Could not find project with the id "${destinationProjectId}". Make sure you have the permission to create workflows in it.`);
        if (sourceProject.id === destinationProject.id &&
            destinationParentFolderId === workflow.parentFolder?.id) {
            throw new transfer_workflow_error_1.TransferWorkflowError("You can't transfer a workflow into the same destination it already belongs to.");
        }
        let parentFolder = null;
        if (destinationParentFolderId) {
            try {
                parentFolder = await this.folderRepository.findOneOrFailFolderInProject(destinationParentFolderId, destinationProjectId);
            }
            catch {
                throw new transfer_workflow_error_1.TransferWorkflowError(`The destination folder with id "${destinationParentFolderId}" does not exist in the project "${destinationProject.name}".`);
            }
        }
        await this.policyEnforcementService.enforceWorkflowTransfer({ workflow, targetProjectId: destinationProject.id }, { kind: 'user', user });
        const wasActive = this.isActiveWorkflow(workflow);
        if (wasActive) {
            await this.activeWorkflowManager.remove(workflowId);
        }
        await this.transferWorkflowOwnership(user, [workflow], destinationProject);
        await this.shareCredentialsWithProject(user, shareCredentials, destinationProject.id);
        await this.workflowRepository.update({ id: workflow.id }, { parentFolder });
        if (wasActive) {
            return await this.attemptWorkflowReactivation(workflowId, workflow.activeVersionId, user.id);
        }
        return;
    }
    async getFolderUsedCredentials(user, folderId, projectId) {
        try {
            await this.folderRepository.findOneOrFailFolderInProject(folderId, projectId);
        }
        catch {
            throw new folder_not_found_error_1.FolderNotFoundError(folderId);
        }
        const { workflows } = await this.workflowFinderService.findWorkflowsForUser(user, ['workflow:read'], { filters: { folderId, projectId }, includeProjects: true });
        const usedCredentials = new Map();
        for (const workflow of workflows) {
            const workflowWithMetaData = this.addOwnerAndSharings(workflow);
            await this.addCredentialsToWorkflow(workflowWithMetaData, user);
            for (const credential of workflowWithMetaData?.usedCredentials ?? []) {
                usedCredentials.set(credential.id, credential);
            }
        }
        return [...usedCredentials.values()];
    }
    async transferFolder(user, sourceProjectId, sourceFolderId, destinationProjectId, destinationParentFolderId, shareCredentials = []) {
        const childrenFolderIds = await this.folderRepository.getAllFolderIdsInHierarchy(sourceFolderId, sourceProjectId);
        const checksTransfer = this.policyEnforcementService.hasChecksFor('workflowTransfer');
        const workflows = await this.workflowRepository.find({
            select: [
                'id',
                'name',
                'activeVersionId',
                'shared',
                ...(checksTransfer ? ['nodes'] : []),
            ],
            relations: ['shared', 'shared.project'],
            where: {
                parentFolder: { id: (0, typeorm_1.In)([...childrenFolderIds, sourceFolderId]) },
            },
        });
        const activeWorkflows = workflows.filter((x) => this.isActiveWorkflow(x));
        const destinationProject = await this.projectService.getProjectWithScope(user, destinationProjectId, ['workflow:create']);
        errors_1.NotFoundError.isDefinedAndNotNull(destinationProject, `Could not find project with the id "${destinationProjectId}". Make sure you have the permission to create workflows in it.`);
        if (destinationParentFolderId !== n8n_workflow_1.PROJECT_ROOT) {
            await this.folderRepository.findOneOrFailFolderInProject(destinationParentFolderId, destinationProjectId);
        }
        await this.folderRepository.findOneOrFailFolderInProject(sourceFolderId, sourceProjectId);
        for (const workflow of workflows) {
            const ownerSharing = workflow.shared.find((s) => s.role === 'workflow:owner');
            errors_1.NotFoundError.isDefinedAndNotNull(ownerSharing, `Could not find owner for workflow "${workflow.id}"`);
            const sourceProject = ownerSharing.project;
            if (sourceProject.id === destinationProject.id) {
                throw new transfer_workflow_error_1.TransferWorkflowError("You can't transfer a workflow into the project that's already owning it.");
            }
        }
        if (checksTransfer) {
            for (const workflow of workflows) {
                await this.policyEnforcementService.enforceWorkflowTransfer({ workflow, targetProjectId: destinationProject.id }, { kind: 'user', user });
            }
        }
        const deactivateWorkflowsPromises = activeWorkflows.map(async (workflow) => await this.activeWorkflowManager.remove(workflow.id));
        await Promise.all(deactivateWorkflowsPromises);
        await this.transferWorkflowOwnership(user, workflows, destinationProject);
        await this.shareCredentialsWithProject(user, shareCredentials, destinationProject.id);
        await this.moveFoldersToDestination(sourceFolderId, childrenFolderIds, destinationProjectId, destinationParentFolderId);
        for (const workflow of activeWorkflows) {
            await this.attemptWorkflowReactivation(workflow.id, workflow.activeVersionId, user.id);
        }
    }
    formatActivationError(error) {
        return {
            error: error.toJSON
                ? error.toJSON()
                : {
                    name: error.name,
                    message: error.message,
                },
        };
    }
    async attemptWorkflowReactivation(workflowId, versionId, userId) {
        try {
            await this.activeWorkflowManager.add(workflowId, 'update', undefined, {
                actor: { kind: 'user', user: { id: userId } },
            });
            return;
        }
        catch (error) {
            try {
                await this.activeWorkflowManager.remove(workflowId);
            }
            catch (cleanupError) {
                this.logger.error(`Failed to roll back partial reactivation of workflow "${workflowId}"`, {
                    workflowId,
                    error: cleanupError,
                });
            }
            await this.workflowRepository.updateActiveState(workflowId, false);
            await this.workflowPublishHistoryRepository.addRecord({
                workflowId,
                versionId,
                event: 'deactivated',
                userId,
            });
            if (error instanceof n8n_workflow_1.WorkflowActivationError) {
                return this.formatActivationError(error);
            }
            throw error;
        }
    }
    async transferWorkflowOwnership(user, workflows, destinationProject) {
        const movedWorkflowIds = workflows
            .filter((workflow) => workflow.shared.find((s) => s.role === 'workflow:owner')?.project.id !==
            destinationProject.id)
            .map((workflow) => workflow.id);
        await this.workflowRepository.manager.transaction(async (trx) => {
            for (const workflow of workflows) {
                await trx.remove(workflow.shared);
                await trx.save(trx.create(db_1.SharedWorkflow, {
                    workflowId: workflow.id,
                    projectId: destinationProject.id,
                    role: 'workflow:owner',
                }));
            }
        });
        for (const workflow of workflows) {
            await this.ownershipService.setWorkflowProjectCacheEntry(workflow.id, destinationProject);
        }
        if (movedWorkflowIds.length > 0) {
            await this.workflowMutationHooks.afterWorkflowsTransferred(movedWorkflowIds, user.id);
        }
    }
    async shareCredentialsWithProject(user, credentialIds, projectId) {
        await this.workflowRepository.runInTransaction({}, async (trx, ctx) => {
            let credentialIdsToShare;
            if ((0, permissions_1.hasGlobalScope)(user, ['credential:share'], { mode: 'allOf' })) {
                credentialIdsToShare = credentialIds;
            }
            else {
                const accessibleIds = new Set(await this.credentialsFinderService.getCredentialIdsByUserAndRole([user.id], { scopes: ['credential:share'] }, ctx));
                credentialIdsToShare = credentialIds.filter((id) => accessibleIds.has(id));
            }
            for (const credentialId of credentialIdsToShare) {
                await this.enterpriseCredentialsService.shareWithProjects(user, credentialId, [projectId], trx);
            }
        });
    }
    async moveFoldersToDestination(sourceFolderId, childrenFolderIds, destinationProjectId, destinationParentFolderId) {
        await this.folderRepository.manager.transaction(async (trx) => {
            await trx.update(db_1.Folder, { id: (0, typeorm_1.In)(childrenFolderIds) }, { homeProject: { id: destinationProjectId } });
            await trx.update(db_1.Folder, { id: sourceFolderId }, {
                homeProject: { id: destinationProjectId },
                parentFolder: destinationParentFolderId === n8n_workflow_1.PROJECT_ROOT ? null : { id: destinationParentFolderId },
            });
        });
    }
    isActiveWorkflow(workflow) {
        return workflow.activeVersionId !== null;
    }
};
exports.EnterpriseWorkflowService = EnterpriseWorkflowService;
exports.EnterpriseWorkflowService = EnterpriseWorkflowService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, db_1.SharedWorkflowRepository, db_1.WorkflowRepository, db_1.CredentialsRepository, credentials_service_1.CredentialsService, ownership_service_1.OwnershipService, project_service_ee_1.ProjectService, active_workflow_manager_1.ActiveWorkflowManager, backend_services_1.CredentialsFinderService, credentials_service_ee_1.EnterpriseCredentialsService, workflow_finder_service_1.WorkflowFinderService, db_1.FolderRepository, db_1.WorkflowPublishHistoryRepository, backend_services_1.WorkflowMutationHooksProxy, policy_enforcement_service_1.PolicyEnforcementService, node_types_1.NodeTypes, credentials_permission_checker_1.CredentialsPermissionChecker, db_1.WorkflowHistoryRepository])
], EnterpriseWorkflowService);
//# sourceMappingURL=workflow.service.ee.js.map