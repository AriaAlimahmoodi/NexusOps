"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractResolvedNodeParameters = extractResolvedNodeParameters;
const di_1 = require("@n8n/di");
const instance_ai_1 = require("@n8n/instance-ai");
const get_error_message_1 = require("@n8n/utils/errors/get-error-message");
const n8n_workflow_1 = require("n8n-workflow");
const execution_persistence_1 = require("../../executions/execution-persistence");
const MAX_RESOLVED_LEAF_CHARS = 8_000;
const UNRECONSTRUCTABLE_CONTEXT_VARS = [
    '$ai',
    '$response',
    '$request',
    '$pageCount',
    '$secrets',
    '$vars',
];
function mentionsUnreconstructableVar(raw) {
    return UNRECONSTRUCTABLE_CONTEXT_VARS.some((variable) => raw.includes(variable));
}
function capResolvedLeaf(value) {
    if (value === null || value === undefined)
        return value;
    const isComplex = typeof value === 'object';
    const serialized = isComplex ? JSON.stringify(value) : String(value);
    if (serialized.length <= MAX_RESOLVED_LEAF_CHARS)
        return value;
    return {
        _truncated: true,
        preview: serialized.slice(0, MAX_RESOLVED_LEAF_CHARS),
        originalLength: serialized.length,
    };
}
function classifyExpressionFailure(raw, errorMessage) {
    if (mentionsUnreconstructableVar(raw))
        return 'unreconstructable-context';
    for (const variable of UNRECONSTRUCTABLE_CONTEXT_VARS) {
        if (errorMessage.includes(variable))
            return 'unreconstructable-context';
    }
    return 'expression-error';
}
function findConnectionOutputIndex(workflow, parentNodeName, currentNodeName) {
    const destinations = workflow.connectionsByDestinationNode[currentNodeName]?.main;
    if (!destinations)
        return 0;
    for (const mainConnections of destinations) {
        for (const connection of mainConnections ?? []) {
            if (connection?.node === parentNodeName) {
                return connection.index ?? 0;
            }
        }
    }
    return 0;
}
function annotatePairedItem(items, destinationInputIndex) {
    return items.map((item, itemIndex) => ({
        ...item,
        pairedItem: { item: itemIndex, input: destinationInputIndex },
    }));
}
function reconstructExecuteData(workflow, currentNodeName, runIndex, runData) {
    const inputName = 'main';
    const currentNode = workflow.getNode(currentNodeName);
    const currentNodeShim = currentNode ?? { name: currentNodeName };
    const currentNodeRun = runData[currentNodeName]?.[runIndex];
    let destinationInputIndex = 0;
    let firstSource;
    for (let i = 0; i < (currentNodeRun?.source?.length ?? 0); i++) {
        const entry = currentNodeRun?.source?.[i];
        if (entry !== null && entry !== undefined) {
            firstSource = entry;
            destinationInputIndex = i;
            break;
        }
    }
    if (firstSource) {
        const previousNode = firstSource.previousNode;
        const previousNodeOutput = firstSource.previousNodeOutput ?? 0;
        const previousNodeRun = firstSource.previousNodeRun ?? 0;
        const parentRun = runData[previousNode]?.[previousNodeRun];
        if (parentRun?.data?.[inputName]) {
            return {
                executeData: {
                    node: currentNodeShim,
                    data: parentRun.data,
                    source: { [inputName]: currentNodeRun?.source ?? [] },
                },
                connectionInputData: annotatePairedItem(parentRun.data[inputName][previousNodeOutput] ?? [], destinationInputIndex),
            };
        }
    }
    const parentNodes = workflow.getParentNodes(currentNodeName, inputName, 1);
    for (const parentNodeName of parentNodes) {
        const parentRuns = runData[parentNodeName];
        if (!parentRuns || parentRuns.length <= runIndex)
            continue;
        const parentRun = parentRuns[runIndex];
        if (!parentRun?.data?.[inputName])
            continue;
        const outputIndex = findConnectionOutputIndex(workflow, parentNodeName, currentNodeName);
        return {
            executeData: {
                node: currentNodeShim,
                data: parentRun.data,
                source: {
                    [inputName]: [
                        {
                            previousNode: parentNodeName,
                            previousNodeOutput: outputIndex,
                            previousNodeRun: runIndex,
                        },
                    ],
                },
            },
            connectionInputData: annotatePairedItem(parentRun.data[inputName]?.[outputIndex] ?? [], 0),
        };
    }
    return {
        executeData: { node: currentNodeShim, data: {}, source: null },
        connectionInputData: [],
    };
}
async function extractResolvedNodeParameters(nodeTypes, executionId, nodeName, options) {
    const execution = await di_1.Container.get(execution_persistence_1.ExecutionPersistence).findSingleExecution(executionId, {
        includeData: true,
        unflattenData: true,
    });
    if (!execution) {
        throw new Error(`Execution ${executionId} not found`);
    }
    const workflowData = execution.workflowData;
    const nodeJson = workflowData.nodes.find((n) => n.name === nodeName);
    if (!nodeJson) {
        throw new Error(`Node "${nodeName}" not found in execution ${executionId}`);
    }
    const runData = execution.data?.resultData?.runData ?? {};
    const nodeRuns = runData[nodeName] ?? [];
    const itemIndex = options?.itemIndex ?? 0;
    const runIndex = options?.runIndex ?? Math.max(nodeRuns.length - 1, 0);
    const workflow = new n8n_workflow_1.Workflow({
        id: workflowData.id,
        name: workflowData.name,
        nodes: workflowData.nodes,
        connections: workflowData.connections,
        active: false,
        nodeTypes,
        staticData: workflowData.staticData,
        settings: workflowData.settings ?? {},
        pinData: workflowData.pinData,
    });
    const { executeData, connectionInputData } = reconstructExecuteData(workflow, nodeName, runIndex, runData);
    const additionalKeys = {
        $execution: {
            id: executionId,
            mode: execution.mode === 'manual' ? 'test' : 'production',
            resumeUrl: '',
            resumeFormUrl: '',
        },
        $vars: {},
    };
    if (nodeJson.type === n8n_workflow_1.HTTP_REQUEST_NODE_TYPE) {
        additionalKeys.$pageCount = 0;
        additionalKeys.$response = { statusCode: 200, headers: {}, body: {} };
        additionalKeys.$request = { headers: {}, body: {}, qs: {} };
    }
    const runExecutionData = execution.data ?? (0, n8n_workflow_1.createEmptyRunExecutionData)();
    const failedExpressions = [];
    const emptyResolutions = [];
    const walk = (value, path) => {
        if (typeof value === 'string' && value.startsWith('=')) {
            try {
                const resolvedValue = workflow.expression.getParameterValue(value, runExecutionData, runIndex, itemIndex, nodeName, connectionInputData, 'manual', additionalKeys, executeData, false, {}, nodeName);
                if (resolvedValue === null || resolvedValue === undefined || resolvedValue === '') {
                    const entry = {
                        path,
                        raw: value,
                        resolved: resolvedValue,
                    };
                    if (mentionsUnreconstructableVar(value)) {
                        entry.reason = 'unreconstructable-context';
                    }
                    emptyResolutions.push(entry);
                }
                return capResolvedLeaf(resolvedValue);
            }
            catch (error) {
                const errorMessage = (0, get_error_message_1.getErrorMessage)(error);
                failedExpressions.push({
                    path,
                    raw: value,
                    error: errorMessage,
                    reason: classifyExpressionFailure(value, errorMessage),
                });
                return null;
            }
        }
        if (Array.isArray(value)) {
            return value.map((item, i) => walk(item, `${path}[${i}]`));
        }
        if (value !== null && typeof value === 'object') {
            const out = {};
            for (const [k, v] of Object.entries(value)) {
                const childPath = path === '' ? k : `${path}.${k}`;
                out[k] = walk(v, childPath);
            }
            return out;
        }
        return value;
    };
    const parameters = (nodeJson.parameters ?? {});
    await workflow.expression.acquireIsolate();
    let resolvedTree;
    try {
        resolvedTree = walk(parameters, '');
    }
    finally {
        await workflow.expression.releaseIsolate();
    }
    const resolved = (0, instance_ai_1.wrapUntrustedData)(JSON.stringify(resolvedTree, null, 2), 'execution-output', `resolved-parameters:${nodeName}`);
    return {
        nodeName,
        runIndex,
        itemIndex,
        parameters,
        resolved,
        failedExpressions,
        emptyResolutions,
    };
}
//# sourceMappingURL=extract-resolved-node-parameters.js.map