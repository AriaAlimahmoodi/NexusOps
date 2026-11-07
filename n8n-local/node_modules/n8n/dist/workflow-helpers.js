"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowStructureBadRequestError = exports.getLastExecutedNodeRuns = exports.getLastExecutedNodeData = exports.makeGetNodeTypeForGrouping = exports.dropInvalidWorkflowGroups = void 0;
exports.validatePinDataSize = validatePinDataSize;
exports.addNodeIds = addNodeIds;
exports.resolveNodeWebhookIds = resolveNodeWebhookIds;
exports.validateWorkflowNodeGroups = validateWorkflowNodeGroups;
exports.sanitizeNodeGroupDescriptions = sanitizeNodeGroupDescriptions;
exports.validateWorkflowStructure = validateWorkflowStructure;
exports.removeDefaultValues = removeDefaultValues;
exports.replaceInvalidCredentials = replaceInvalidCredentials;
exports.getVariables = getVariables;
exports.shouldRestartParentExecution = shouldRestartParentExecution;
exports.updateParentExecutionWithChildResults = updateParentExecutionWithChildResults;
exports.getActiveVersionUpdateValue = getActiveVersionUpdateValue;
exports.preserveInputOverride = preserveInputOverride;
const api_types_1 = require("@n8n/api-types");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
Object.defineProperty(exports, "dropInvalidWorkflowGroups", { enumerable: true, get: function () { return n8n_workflow_1.dropInvalidWorkflowGroups; } });
Object.defineProperty(exports, "makeGetNodeTypeForGrouping", { enumerable: true, get: function () { return n8n_workflow_1.makeGetNodeTypeForGrouping; } });
const uuid_1 = require("uuid");
const errors_1 = require("@n8n/errors");
const variables_service_ee_1 = require("./environments.ee/variables/variables.service.ee");
const credential_sharing_1 = require("./constants/credential-sharing");
const execution_persistence_1 = require("./executions/execution-persistence");
const pre_execution_checks_1 = require("./executions/pre-execution-checks");
const node_types_1 = require("./node-types");
const ownership_service_1 = require("./services/ownership.service");
var n8n_workflow_2 = require("n8n-workflow");
Object.defineProperty(exports, "getLastExecutedNodeData", { enumerable: true, get: function () { return n8n_workflow_2.getLastExecutedNodeData; } });
Object.defineProperty(exports, "getLastExecutedNodeRuns", { enumerable: true, get: function () { return n8n_workflow_2.getLastExecutedNodeRuns; } });
function validatePinDataSize(workflow) {
    if (!workflow.pinData)
        return;
    const pinDataStr = JSON.stringify(workflow.pinData);
    const pinDataSize = Buffer.byteLength(pinDataStr, 'utf8');
    if (pinDataSize > api_types_1.MAX_PINNED_DATA_SIZE) {
        throw new errors_1.BadRequestError(`Pinned data exceeds the maximum allowed size of ${api_types_1.MAX_PINNED_DATA_SIZE / (1024 * 1024)} MB`);
    }
    const { pinData: _, ...workflowWithoutPinData } = workflow;
    const workflowSize = Buffer.byteLength(JSON.stringify(workflowWithoutPinData), 'utf8') + pinDataSize;
    const limit = api_types_1.MAX_WORKFLOW_SIZE - api_types_1.MAX_EXPECTED_REQUEST_SIZE;
    if (workflowSize > limit) {
        const limitMB = Math.floor(limit / (1024 * 1024));
        throw new errors_1.BadRequestError(`Workflow with pinned data exceeds the maximum allowed size of ${limitMB} MB`);
    }
}
function addNodeIds(workflow) {
    const { nodes } = workflow;
    if (!nodes)
        return;
    nodes.forEach((node) => {
        if (!node.id) {
            node.id = (0, uuid_1.v4)();
        }
    });
}
function resolveNodeWebhookIds(workflow, nodeTypes) {
    const { nodes } = workflow;
    if (!nodes)
        return;
    for (const node of nodes) {
        try {
            const nodeType = nodeTypes.getByNameAndVersion(node.type, node.typeVersion);
            (0, n8n_workflow_1.resolveNodeWebhookId)(node, nodeType.description);
        }
        catch {
        }
    }
}
function validateWorkflowNodeGroups(workflow, getNodeType, rules = {}) {
    const result = (0, n8n_workflow_1.validateWorkflowGroups)({
        nodes: workflow.nodes,
        connectionsBySourceNode: workflow.connections,
        nodeGroups: workflow.nodeGroups,
        getNodeType,
        ...rules,
    });
    if (!result.valid) {
        throw new errors_1.BadRequestError(result.violations[0].message);
    }
}
function sanitizeNodeGroupDescriptions(workflow) {
    const warnings = [];
    for (const group of workflow.nodeGroups ?? []) {
        const original = group.description;
        if (original === undefined)
            continue;
        const normalized = (0, n8n_workflow_1.normalizeGroupDescription)(original);
        if (normalized === original)
            continue;
        if (normalized === undefined) {
            delete group.description;
            if (typeof original !== 'string') {
                warnings.push(`Group "${group.name}" description was not plain text and was removed.`);
            }
        }
        else {
            group.description = normalized;
            warnings.push(`Group "${group.name}" description exceeded ${n8n_workflow_1.GROUP_DESCRIPTION_MAX_LENGTH} characters and was truncated.`);
        }
    }
    return warnings;
}
class WorkflowStructureBadRequestError extends errors_1.BadRequestError {
    constructor(message, issues) {
        super(message);
        this.issues = issues;
    }
}
exports.WorkflowStructureBadRequestError = WorkflowStructureBadRequestError;
function validateWorkflowStructure(workflow) {
    const result = (0, n8n_workflow_1.safeParseWorkflowStructure)(workflow);
    if (result.success)
        return;
    const details = result.issues
        .map(({ path, message, code }) => {
        const formattedPath = Array.isArray(path)
            ? (0, n8n_workflow_1.formatWorkflowStructureIssuePath)(path)
            : 'workflow';
        return `${formattedPath} (${code}): ${message}`;
    })
        .join('; ');
    throw new WorkflowStructureBadRequestError(`Workflow structure is invalid. ${details}`, result.issues);
}
function removeDefaultValues(settings, defaultExecutionTimeout) {
    const cleanedSettings = { ...settings };
    const keysAllowingDefault = [
        'errorWorkflow',
        'timezone',
        'saveDataErrorExecution',
        'saveDataSuccessExecution',
        'saveManualExecutions',
        'saveExecutionProgress',
    ];
    for (const key of keysAllowingDefault) {
        if (cleanedSettings[key] === 'DEFAULT') {
            delete cleanedSettings[key];
        }
    }
    if (cleanedSettings.executionTimeout === defaultExecutionTimeout) {
        delete cleanedSettings.executionTimeout;
    }
    if (!cleanedSettings.credentialResolverId) {
        delete cleanedSettings.credentialResolverId;
    }
    return cleanedSettings;
}
function credentialCacheKey(parts) {
    return JSON.stringify(parts) ?? '';
}
async function replaceInvalidCredentials(workflow, projectId, cache = new Map()) {
    const { nodes } = workflow;
    if (!nodes)
        return workflow;
    for (const node of nodes) {
        if (!node.credentials || node.disabled) {
            continue;
        }
        const allNodeCredentials = Object.entries(node.credentials);
        for (const [nodeCredentialType, nodeCredentials] of allNodeCredentials) {
            if (!(0, n8n_workflow_1.isSafeObjectProperty)(nodeCredentialType)) {
                continue;
            }
            if (nodeCredentials === null || nodeCredentials === undefined) {
                continue;
            }
            if (nodeCredentials.__aiGatewayManaged)
                continue;
            if (typeof nodeCredentials === 'string' || nodeCredentials.id === null) {
                const name = typeof nodeCredentials === 'string' ? nodeCredentials : nodeCredentials.name;
                const cacheKey = credentialCacheKey(['name', nodeCredentialType, name]);
                const cachedCredential = cache.get(cacheKey);
                if (cachedCredential === undefined) {
                    const credentials = await di_1.Container.get(db_1.CredentialsRepository).findByNameAndTypeInProject(name, nodeCredentialType, projectId);
                    if (credentials?.length === 1) {
                        const resolvedCredential = {
                            id: credentials[0].id,
                            name: credentials[0].name,
                        };
                        cache.set(cacheKey, resolvedCredential);
                        node.credentials[nodeCredentialType] = { ...resolvedCredential };
                        continue;
                    }
                    cache.set(cacheKey, {
                        id: null,
                        name,
                    });
                }
                else {
                    node.credentials[nodeCredentialType] = { ...cachedCredential };
                }
                continue;
            }
            const idCacheKey = credentialCacheKey(['id', nodeCredentialType, nodeCredentials.id]);
            const idAndNameCacheKey = credentialCacheKey([
                'idAndName',
                nodeCredentialType,
                nodeCredentials.id,
                nodeCredentials.name,
            ]);
            const cachedFallback = cache.get(idAndNameCacheKey);
            if (cachedFallback !== undefined) {
                node.credentials[nodeCredentialType] = { ...cachedFallback };
                continue;
            }
            const cachedById = cache.get(idCacheKey);
            if (cachedById === undefined) {
                const credentials = await di_1.Container.get(db_1.CredentialsRepository).findOneBy({
                    id: nodeCredentials.id,
                    type: nodeCredentialType,
                });
                if (credentials) {
                    const resolvedCredential = {
                        id: credentials.id,
                        name: credentials.name,
                    };
                    cache.set(idCacheKey, resolvedCredential);
                    node.credentials[nodeCredentialType] = { ...resolvedCredential };
                    continue;
                }
                const credsByName = await di_1.Container.get(db_1.CredentialsRepository).findByNameAndTypeInProject(nodeCredentials.name, nodeCredentialType, projectId);
                if (credsByName?.length === 1) {
                    const resolvedCredential = {
                        id: credsByName[0].id,
                        name: credsByName[0].name,
                    };
                    cache.set(idAndNameCacheKey, resolvedCredential);
                    cache.set(credentialCacheKey(['id', nodeCredentialType, credsByName[0].id]), resolvedCredential);
                    node.credentials[nodeCredentialType] = { ...resolvedCredential };
                    continue;
                }
                cache.set(idAndNameCacheKey, { ...nodeCredentials });
                continue;
            }
            node.credentials[nodeCredentialType] = { ...cachedById };
        }
    }
    return workflow;
}
async function getVariables(workflowId, projectId) {
    const [variables, project] = await Promise.all([
        di_1.Container.get(variables_service_ee_1.VariablesService).getAllCached(),
        workflowId && !projectId
            ? di_1.Container.get(ownership_service_1.OwnershipService).getWorkflowProjectCached(workflowId)
            : null,
    ]);
    const projectIdToUse = projectId ?? project?.id;
    return Object.freeze((0, n8n_workflow_1.resolveVariables)(variables, projectIdToUse));
}
function shouldRestartParentExecution(parentExecution) {
    if (parentExecution === undefined) {
        return false;
    }
    if (parentExecution.shouldResume === undefined) {
        return true;
    }
    return parentExecution.shouldResume;
}
function unionIds(first, second) {
    const ids = new Set([...(first ?? []), ...(second ?? [])]);
    return ids.size > 0 ? [...ids].sort() : undefined;
}
async function updateParentExecutionWithChildResults(parentExecutionId, subworkflowResults, childExecution, childWorkflowData) {
    const subworkflowError = subworkflowResults.data.resultData.error;
    const lastExecutedNodeData = (0, n8n_workflow_1.getLastExecutedNodeData)(subworkflowResults);
    if (!subworkflowError && !lastExecutedNodeData?.data)
        return false;
    const executionPersistence = di_1.Container.get(execution_persistence_1.ExecutionPersistence);
    const parent = await executionPersistence.findSingleExecution(parentExecutionId, {
        includeData: true,
        unflattenData: true,
    });
    if (parent?.status !== 'waiting' || parent.data.waitReason === 'suspended') {
        return false;
    }
    const parentWithSubWorkflowResults = { data: { ...parent.data } };
    const nodeExecutionStack = parentWithSubWorkflowResults.data.executionData?.nodeExecutionStack;
    if (!nodeExecutionStack || nodeExecutionStack?.length === 0) {
        return false;
    }
    const waitingChildExecutionIds = nodeExecutionStack[0].metadata?.waitingChildExecutionIds;
    if (childExecution &&
        waitingChildExecutionIds?.length &&
        !waitingChildExecutionIds.includes(childExecution.executionId)) {
        return false;
    }
    const childCredentialIds = (0, credential_sharing_1.isCredSharingEnabled)() && childWorkflowData
        ? di_1.Container.get(pre_execution_checks_1.CredentialsPermissionChecker).getCredentialIdsForNodes(childWorkflowData.nodes)
        : [];
    const dynamicCredentialsUsage = (0, n8n_workflow_1.summarizeDynamicCredentialsUsage)(subworkflowResults.data, childCredentialIds);
    if (Object.keys(dynamicCredentialsUsage).length > 0) {
        const earlierUsage = nodeExecutionStack[0].metadata?.dynamicCredentialsUsage;
        const usedCredentialIds = unionIds(earlierUsage?.usedCredentialIds, dynamicCredentialsUsage.usedCredentialIds);
        nodeExecutionStack[0].metadata = {
            ...nodeExecutionStack[0].metadata,
            dynamicCredentialsUsage: {
                ...earlierUsage,
                ...dynamicCredentialsUsage,
                ...(usedCredentialIds && { usedCredentialIds }),
            },
        };
        const waitingTasks = parentWithSubWorkflowResults.data.resultData?.runData?.[nodeExecutionStack[0].node.name];
        const waitingTask = waitingTasks?.[waitingTasks.length - 1];
        if (waitingTask) {
            if (dynamicCredentialsUsage.usedDynamicCredentials) {
                waitingTask.usedDynamicCredentials = true;
            }
            if (dynamicCredentialsUsage.attemptedDynamicCredentials) {
                waitingTask.attemptedDynamicCredentials = true;
            }
            const waitingTaskCredentialIds = unionIds(waitingTask.usedCredentialIds, dynamicCredentialsUsage.usedCredentialIds);
            if (waitingTaskCredentialIds)
                waitingTask.usedCredentialIds = waitingTaskCredentialIds;
        }
        const { runtimeData } = parentWithSubWorkflowResults.data.executionData ?? {};
        if (dynamicCredentialsUsage.usedDynamicCredentials &&
            dynamicCredentialsUsage.dynamicCredentialsResolvedUserId &&
            runtimeData) {
            runtimeData.executedByUserId = dynamicCredentialsUsage.dynamicCredentialsResolvedUserId;
        }
    }
    (0, n8n_workflow_1.escalateSubWorkflowRedaction)(parentWithSubWorkflowResults.data.executionData?.runtimeData, (0, n8n_workflow_1.summarizeSubWorkflowRedaction)(subworkflowResults.data, { includeOwn: true }));
    if (subworkflowError) {
        nodeExecutionStack[0].metadata = {
            ...nodeExecutionStack[0].metadata,
            resumeError: subworkflowError,
            ...(childExecution && { subExecution: childExecution }),
        };
    }
    else if (lastExecutedNodeData?.data) {
        const policy = subworkflowResults.data.subWorkflowOutput;
        if (policy) {
            if (!childWorkflowData) {
                throw new n8n_workflow_1.UnexpectedError('The saved child workflow is required to collect its output.');
            }
            const workflow = new n8n_workflow_1.Workflow({
                ...childWorkflowData,
                nodeTypes: di_1.Container.get(node_types_1.NodeTypes),
            });
            nodeExecutionStack[0].data = {
                main: await (0, n8n_workflow_1.collectSubWorkflowOutput)(subworkflowResults, workflow, policy),
            };
        }
        else {
            nodeExecutionStack[0].data = lastExecutedNodeData.data;
        }
    }
    await executionPersistence.updateExistingExecution(parentExecutionId, parentWithSubWorkflowResults);
    return true;
}
function getActiveVersionUpdateValue(dbWorkflow, updatedVersion, updatedActive) {
    if (updatedActive) {
        return updatedVersion;
    }
    if (updatedActive === false) {
        return null;
    }
    return dbWorkflow.activeVersionId ? updatedVersion : null;
}
function preserveInputOverride(runDataArray) {
    const entryToPop = runDataArray.pop();
    const preservedInputOverride = entryToPop.inputOverride;
    if (preservedInputOverride) {
        runDataArray.push({
            startTime: 0,
            executionTime: 0,
            executionIndex: 0,
            source: entryToPop.source,
            inputOverride: preservedInputOverride,
        });
    }
}
//# sourceMappingURL=workflow-helpers.js.map