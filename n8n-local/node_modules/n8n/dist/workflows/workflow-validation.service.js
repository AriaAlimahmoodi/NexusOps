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
exports.WorkflowValidationService = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const constants_1 = require("../constants");
const credential_types_1 = require("../credential-types");
const dynamic_credentials_proxy_1 = require("../credentials/dynamic-credentials-proxy");
const credentials_permission_checker_1 = require("../executions/pre-execution-checks/credentials-permission-checker");
const utils_1 = require("../utils");
function formatCredentialNames(credentials) {
    return credentials.map((c) => `"${c.name}"`).join(', ');
}
let WorkflowValidationService = class WorkflowValidationService {
    constructor(workflowRepository, credentialsRepository, dynamicCredentialsProxy, credentialTypes, credentialsPermissionChecker) {
        this.workflowRepository = workflowRepository;
        this.credentialsRepository = credentialsRepository;
        this.dynamicCredentialsProxy = dynamicCredentialsProxy;
        this.credentialTypes = credentialTypes;
        this.credentialsPermissionChecker = credentialsPermissionChecker;
    }
    executableNodeNames(nodes, connections, nodeTypes) {
        return (0, n8n_workflow_1.getReachableNodeNames)(nodes, connections, (0, n8n_workflow_1.mapConnectionsByDestination)(connections), (node) => {
            const nodeType = nodeTypes.getByNameAndVersion(node.type, node.typeVersion);
            return !!nodeType && (0, n8n_workflow_1.isTriggerLikeNode)(nodeType);
        });
    }
    validateNodeConfiguration(nodes, connections, nodeTypes) {
        try {
            const executable = this.executableNodeNames(nodes, connections, nodeTypes);
            const issuesFound = [];
            for (const node of nodes) {
                try {
                    if (node.disabled)
                        continue;
                    const nodeType = nodeTypes.getByNameAndVersion(node.type, node.typeVersion);
                    if (!nodeType) {
                        issuesFound.push({
                            nodeName: node.name,
                            issues: ['Node type not found'],
                        });
                        continue;
                    }
                    if (!executable.has(node.name))
                        continue;
                    const nodeIssues = [];
                    const credentialIssues = (0, n8n_workflow_1.validateNodeCredentials)(node, nodeType);
                    for (const issue of credentialIssues) {
                        if (issue.type === 'missing') {
                            nodeIssues.push(`Missing required credential: ${issue.displayName}`);
                        }
                        else if (issue.type === 'not-configured') {
                            nodeIssues.push(`Credential not configured: ${issue.displayName}`);
                        }
                    }
                    const parameterIssues = this.validateNodeParameters(node, nodeType);
                    nodeIssues.push(...parameterIssues);
                    if (nodeIssues.length > 0) {
                        issuesFound.push({
                            nodeName: node.name,
                            issues: nodeIssues,
                        });
                    }
                }
                catch (nodeError) {
                    issuesFound.push({
                        nodeName: node.name,
                        issues: [`Error validating node: ${(0, ensure_error_1.ensureError)(nodeError).message}`],
                    });
                }
            }
            if (issuesFound.length === 0) {
                return { isValid: true };
            }
            const errorLines = issuesFound.map((item) => {
                const issuesList = item.issues.map((issue) => `  - ${issue}`).join('\n');
                return `Node "${item.nodeName}":\n${issuesList}`;
            });
            const nodeCount = issuesFound.length;
            const pluralSuffix = nodeCount === 1 ? '' : 's';
            const error = `Cannot publish workflow: ${nodeCount} node${pluralSuffix} have configuration issues:\n\n${errorLines.join('\n\n')}`;
            return {
                isValid: false,
                error,
            };
        }
        catch (error) {
            return {
                isValid: false,
                error: `Workflow validation failed: ${(0, ensure_error_1.ensureError)(error).message}`,
            };
        }
    }
    validateNodeParameters(node, nodeType) {
        const issues = [];
        try {
            if (!nodeType.description?.properties) {
                return issues;
            }
            const nodeIssues = n8n_workflow_1.NodeHelpers.getNodeParametersIssues(nodeType.description.properties, node, nodeType.description);
            if (nodeIssues?.parameters) {
                const paramNames = Object.keys(nodeIssues.parameters);
                if (paramNames.length > 0) {
                    issues.push(`Missing or invalid required parameters: ${paramNames.join(', ')}`);
                }
            }
        }
        catch (error) {
            issues.push('Error validating node parameters');
        }
        return issues;
    }
    validateCredentialNodeRestrictions(nodes) {
        const violations = [];
        for (const node of nodes) {
            if (!node.credentials)
                continue;
            const activeCredentialTypes = this.getActiveCredentialTypes(node);
            for (const credentialType of activeCredentialTypes) {
                if (!node.credentials[credentialType])
                    continue;
                let typeDef;
                try {
                    typeDef = this.credentialTypes.getByName(credentialType);
                }
                catch {
                    continue;
                }
                if (!typeDef?.restrictToSupportedNodes)
                    continue;
                const supportedNodes = this.credentialTypes.getSupportedNodes(credentialType);
                if (supportedNodes.includes(node.type))
                    continue;
                violations.push(`Node "${node.name}" (${node.type}) cannot use credential type "${credentialType}" — it is restricted to: ${supportedNodes.length > 0 ? supportedNodes.join(', ') : '(no nodes)'}.`);
            }
        }
        if (violations.length === 0)
            return { isValid: true };
        return {
            isValid: false,
            error: `Cannot save workflow: ${violations.join(' ')}`,
        };
    }
    validateTriggerNodeIds(triggerNodes) {
        const violations = [];
        const namesById = new Map();
        for (const node of triggerNodes) {
            if (!node.id) {
                violations.push(`trigger "${node.name}" has no node ID`);
                continue;
            }
            const names = namesById.get(node.id);
            if (names) {
                names.push(node.name);
            }
            else {
                namesById.set(node.id, [node.name]);
            }
        }
        for (const [nodeId, names] of namesById) {
            if (names.length < 2)
                continue;
            const nameList = names.map((name) => `"${name}"`).join(', ');
            violations.push(`triggers ${nameList} share the node ID "${nodeId}"`);
        }
        if (violations.length === 0)
            return { isValid: true };
        return {
            isValid: false,
            error: `Cannot publish workflow: ${violations.join('; ')}. Remove and re-add the affected nodes to give them new IDs.`,
        };
    }
    getActiveCredentialTypes(node) {
        if (!node.credentials)
            return [];
        if (!n8n_core_1.FULL_ACCESS_NODE_TYPES.has(node.type)) {
            return Object.keys(node.credentials);
        }
        const params = (node.parameters ?? {});
        const auth = typeof params.authentication === 'string' ? params.authentication : null;
        if (auth === 'predefinedCredentialType') {
            const cred = params.nodeCredentialType;
            return typeof cred === 'string' && cred.length > 0 ? [cred] : [];
        }
        if (auth === 'genericCredentialType') {
            const cred = params.genericAuthType;
            return typeof cred === 'string' && cred.length > 0 ? [cred] : [];
        }
        return [];
    }
    async validateForActivation(nodes, connections, nodeTypes) {
        const triggerValidation = (0, n8n_workflow_1.validateWorkflowHasTriggerLikeNode)(nodes, nodeTypes, constants_1.STARTING_NODES);
        if (!triggerValidation.isValid) {
            return {
                isValid: false,
                error: triggerValidation.error ??
                    'Workflow cannot be activated because it has no trigger node. At least one active trigger, poll trigger, webhook trigger, or schedule trigger node is required.',
            };
        }
        const nodesArray = Object.values(nodes);
        const configValidation = this.validateNodeConfiguration(nodesArray, connections, nodeTypes);
        if (!configValidation.isValid) {
            return configValidation;
        }
        return await this.validateRequiredInputsConnected(nodesArray, connections, nodeTypes);
    }
    async validateRequiredInputsConnected(nodes, connections, nodeTypes) {
        const workflow = new n8n_workflow_1.Workflow({
            nodes: nodes.map((node) => ({ ...node })),
            connections,
            active: false,
            nodeTypes,
        });
        const executable = this.executableNodeNames(nodes, connections, nodeTypes);
        const issues = [];
        const canOutputMainByName = new Map();
        const canOutputMain = (candidate) => {
            const cached = canOutputMainByName.get(candidate.name);
            if (cached !== undefined)
                return cached;
            const candidateType = nodeTypes.getByNameAndVersion(candidate.type, candidate.typeVersion);
            const result = candidateType?.description
                ? n8n_workflow_1.NodeHelpers.getNodeOutputs(workflow, candidate, candidateType.description).some((output) => (typeof output === 'string' ? output : output.type) === n8n_workflow_1.NodeConnectionTypes.Main)
                : true;
            canOutputMainByName.set(candidate.name, result);
            return result;
        };
        await (0, utils_1.withExpressionIsolate)(workflow, async () => {
            for (const node of nodes) {
                if (node.disabled)
                    continue;
                const nodeType = nodeTypes.getByNameAndVersion(node.type, node.typeVersion);
                if (!nodeType?.description)
                    continue;
                if (!executable.has(node.name))
                    continue;
                if (!(0, n8n_workflow_1.isTriggerLikeNode)(nodeType) &&
                    (0, n8n_workflow_1.onlySuppliesDisabledNodes)(node, connections, nodes, canOutputMain)) {
                    continue;
                }
                let required;
                try {
                    required = (0, n8n_workflow_1.getUnconnectedRequiredInputs)(workflow, node, nodeType.description, {
                        throwOnExpressionError: true,
                    });
                }
                catch (error) {
                    issues.push(`the inputs of '${node.name}' could not be determined (${(0, ensure_error_1.ensureError)(error).message})`);
                    continue;
                }
                for (const input of required) {
                    issues.push(`'${node.name}' has no node connected to its required '${input.displayName ?? input.type}' input`);
                }
            }
        });
        if (issues.length > 0) {
            return {
                isValid: false,
                error: `Workflow cannot be activated because required inputs are not connected: ${issues.join('; ')}.`,
            };
        }
        return { isValid: true };
    }
    async validateDynamicCredentials(nodes, nodeTypes, workflowSettings) {
        const credentialIds = this.collectCredentialIds(nodes);
        if (credentialIds.size === 0) {
            return { isValid: true };
        }
        const resolvableCredentials = await this.credentialsRepository.find({
            where: { id: (0, typeorm_1.In)([...credentialIds]), isResolvable: true, usageScope: 'project' },
            select: ['id', 'name'],
        });
        if (resolvableCredentials.length === 0) {
            return { isValid: true };
        }
        const credNames = formatCredentialNames(resolvableCredentials);
        const workflowResolverId = this.dynamicCredentialsProxy.getEffectiveResolverId(workflowSettings);
        const triggers = this.classifyTriggerIdentities(nodes, nodeTypes);
        const error = this.getDynamicCredentialsError(workflowResolverId, credNames, triggers);
        return error
            ? { isValid: false, error: `Cannot publish workflow: ${error}` }
            : { isValid: true };
    }
    async validatePublisherCredentialAccess(user, nodes, workflowId) {
        const inaccessible = await this.credentialsPermissionChecker.findInaccessibleForUser(user.id, nodes, workflowId);
        if (inaccessible.length === 0)
            return { isValid: true };
        const unshared = inaccessible.filter((c) => c.exists);
        const missing = inaccessible.filter((c) => !c.exists);
        const sentences = [];
        if (unshared.length > 0) {
            const plural = unshared.length > 1;
            const credNames = formatCredentialNames(unshared);
            sentences.push(`You do not have access to credential${plural ? 's' : ''} ${credNames}. Ask ${plural ? 'their owners' : 'its owner'} to share ${plural ? 'them' : 'it'} with you.`);
        }
        if (missing.length > 0) {
            const plural = missing.length > 1;
            const credNames = formatCredentialNames(missing);
            sentences.push(`Credential${plural ? 's' : ''} ${credNames} no longer exist${plural ? '' : 's'}. Update the node to use a different credential.`);
        }
        return { isValid: false, error: `Cannot publish workflow: ${sentences.join(' ')}` };
    }
    getDynamicCredentialsError(workflowResolverId, credNames, triggers) {
        if (!workflowResolverId) {
            return `end-user credentials (${credNames}) require a resolver to be configured.`;
        }
        const { allTriggersProvideExternalIdentity, allTriggersProvideN8nIdentity } = triggers;
        if (workflowResolverId === this.dynamicCredentialsProxy.getSystemResolverId()) {
            if (allTriggersProvideN8nIdentity)
                return undefined;
            const triggersList = this.getN8nUserAuthTriggersList();
            return `end-user credentials (${credNames}) are only supported with ${triggersList}. To use another trigger, switch the credential to Fixed.`;
        }
        if (allTriggersProvideExternalIdentity)
            return undefined;
        return `end-user credentials (${credNames}) require a trigger with an identity extractor configured. Please configure an identity extractor on the trigger node.`;
    }
    getN8nUserAuthTriggersList() {
        return 'manual and sub-workflow triggers, chat triggers available in n8n Chat Hub or using n8n user authentication in hosted chat mode, and MCP, form, or webhook triggers with n8n user authentication';
    }
    collectCredentialIds(nodes) {
        const credentialIds = new Set();
        for (const node of nodes) {
            if (node.disabled)
                continue;
            for (const credName of Object.keys(node.credentials ?? {})) {
                const credId = node.credentials?.[credName]?.id;
                if (credId) {
                    credentialIds.add(credId);
                }
            }
        }
        return credentialIds;
    }
    classifyTriggerIdentities(nodes, nodeTypes) {
        let allTriggersProvideExternalIdentity = true;
        let allTriggersProvideN8nIdentity = true;
        let hasTrigger = false;
        for (const node of nodes) {
            if (node.disabled)
                continue;
            const nodeType = nodeTypes.getByNameAndVersion(node.type, node.typeVersion);
            if (!nodeType?.description || !(0, n8n_workflow_1.isTriggerNode)(nodeType.description))
                continue;
            hasTrigger = true;
            const { providesExternalIdentity, providesN8nIdentity } = (0, n8n_workflow_1.classifyTriggerIdentity)(node.type, node.parameters);
            allTriggersProvideExternalIdentity &&= providesExternalIdentity;
            allTriggersProvideN8nIdentity &&= providesN8nIdentity;
        }
        if (!hasTrigger) {
            return { allTriggersProvideExternalIdentity: false, allTriggersProvideN8nIdentity: false };
        }
        return { allTriggersProvideExternalIdentity, allTriggersProvideN8nIdentity };
    }
    async validateSubWorkflowReferences(workflowId, nodes) {
        const executeWorkflowNodes = nodes.filter((node) => node.type === 'n8n-nodes-base.executeWorkflow' && !node.disabled);
        if (executeWorkflowNodes.length === 0) {
            return { isValid: true };
        }
        const invalidReferences = [];
        for (const node of executeWorkflowNodes) {
            const subWorkflowId = this.extractWorkflowId(node);
            const source = typeof node.parameters?.source === 'string' ? node.parameters.source : undefined;
            if (this.shouldSkipSubWorkflowValidation(subWorkflowId, source)) {
                continue;
            }
            const status = await this.getWorkflowStatus(workflowId, subWorkflowId);
            if (!status.exists || !status.isPublished) {
                invalidReferences.push({
                    nodeName: node.name,
                    workflowId: subWorkflowId,
                    workflowName: status.exists ? status.name : undefined,
                });
            }
        }
        if (invalidReferences.length > 0) {
            const errorMessages = invalidReferences.map((ref) => {
                const workflowName = ref.workflowName ? ` ("${ref.workflowName}")` : '';
                return `Node "${ref.nodeName}" references workflow ${ref.workflowId}${workflowName} which is not published`;
            });
            return {
                isValid: false,
                error: `Cannot publish workflow: ${errorMessages.join('; ')}. Please publish all referenced sub-workflows first.`,
                invalidReferences,
            };
        }
        return { isValid: true };
    }
    async getWorkflowStatus(parentWorkflowId, subWorkflowId) {
        if (subWorkflowId === parentWorkflowId) {
            return { exists: true, isPublished: true };
        }
        const subWorkflow = await this.workflowRepository.get({ id: subWorkflowId }, { relations: [] });
        if (!subWorkflow) {
            return { exists: false, isPublished: false };
        }
        return {
            exists: true,
            isPublished: subWorkflow.activeVersionId !== null,
            name: subWorkflow.name,
        };
    }
    hasValueProperty(obj) {
        return typeof obj === 'object' && obj !== null && 'value' in obj;
    }
    extractWorkflowId(node) {
        const workflowIdParam = node.parameters?.workflowId;
        if (this.hasValueProperty(workflowIdParam)) {
            return workflowIdParam.value;
        }
        if (typeof workflowIdParam === 'string') {
            return workflowIdParam;
        }
        return undefined;
    }
    shouldSkipSubWorkflowValidation(workflowId, source) {
        if (!workflowId)
            return true;
        if (workflowId.startsWith('='))
            return true;
        if (source && source !== 'database')
            return true;
        return false;
    }
};
exports.WorkflowValidationService = WorkflowValidationService;
exports.WorkflowValidationService = WorkflowValidationService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.WorkflowRepository, db_1.CredentialsRepository, dynamic_credentials_proxy_1.DynamicCredentialsProxy, credential_types_1.CredentialTypes, credentials_permission_checker_1.CredentialsPermissionChecker])
], WorkflowValidationService);
//# sourceMappingURL=workflow-validation.service.js.map