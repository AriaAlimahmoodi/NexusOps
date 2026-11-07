"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllKeyPaths = exports.shouldAssignExecuteMethod = exports.isPositiveInteger = exports.assertNever = exports.isIntegerString = exports.toError = exports.findCliWorkflowStart = exports.findSubworkflowStart = void 0;
exports.isWorkflowIdValid = isWorkflowIdValid;
exports.stripToolSuffix = stripToolSuffix;
exports.satisfiesToolCapability = satisfiesToolCapability;
exports.removeTrailingSlash = removeTrailingSlash;
exports.rightDiff = rightDiff;
exports.setMicrosoftObservabilityDefaults = setMicrosoftObservabilityDefaults;
exports.containsExpression = containsExpression;
exports.isObject = isObject;
exports.withExpressionIsolate = withExpressionIsolate;
const n8n_workflow_1 = require("n8n-workflow");
const constants_1 = require("./constants");
function isWorkflowIdValid(id) {
    return typeof id === 'string' && id.length > 0 && id.length <= 21;
}
function stripToolSuffix(nodeType) {
    return nodeType.replace(/HitlTool$/, '').replace(/Tool$/, '');
}
function satisfiesToolCapability(syntheticToolName, nodeType) {
    return (0, n8n_workflow_1.isHitlToolType)(syntheticToolName) || !!nodeType.description.usableAsTool;
}
function findWorkflowStart(executionMode) {
    return function (nodes) {
        const eligibleNodes = executionMode === 'cli' ? nodes.filter((node) => node.disabled !== true) : nodes;
        const executeWorkflowTriggerNode = eligibleNodes.find((node) => node.type === 'n8n-nodes-base.executeWorkflowTrigger');
        if (executeWorkflowTriggerNode)
            return executeWorkflowTriggerNode;
        const startNode = eligibleNodes.find((node) => constants_1.STARTING_NODES.includes(node.type));
        if (startNode)
            return startNode;
        const title = 'Missing node to start execution';
        const description = "Please make sure the workflow you're calling contains an Execute Workflow Trigger node";
        if (executionMode === 'integrated') {
            throw new n8n_workflow_1.SubworkflowOperationError(title, description);
        }
        throw new n8n_workflow_1.CliWorkflowOperationError(title, description);
    };
}
exports.findSubworkflowStart = findWorkflowStart('integrated');
exports.findCliWorkflowStart = findWorkflowStart('cli');
const toError = (maybeError) => maybeError instanceof Error ? maybeError : new Error(`${maybeError}`);
exports.toError = toError;
const isIntegerString = (value) => /^\d+$/.test(value);
exports.isIntegerString = isIntegerString;
function removeTrailingSlash(path) {
    return path.endsWith('/') ? path.slice(0, -1) : path;
}
function rightDiff([arr1, keyExtractor1], [arr2, keyExtractor2]) {
    const keyMap = arr1.reduce((map, item) => {
        map[keyExtractor1(item)] = true;
        return map;
    }, {});
    return arr2.reduce((acc, item) => {
        if (!keyMap[keyExtractor2(item)]) {
            acc.push(item);
        }
        return acc;
    }, []);
}
const assertNever = (_value) => { };
exports.assertNever = assertNever;
const isPositiveInteger = (maybeInt) => /^[1-9]\d*$/.test(maybeInt);
exports.isPositiveInteger = isPositiveInteger;
const shouldAssignExecuteMethod = (nodeType) => {
    const isDeclarativeNode = nodeType?.description?.requestDefaults !== undefined;
    return (!nodeType.execute &&
        !nodeType.supplyData &&
        !nodeType.poll &&
        !nodeType.trigger &&
        (!nodeType.webhook || isDeclarativeNode) &&
        (!nodeType.methods || isDeclarativeNode));
};
exports.shouldAssignExecuteMethod = shouldAssignExecuteMethod;
const getAllKeyPaths = (obj, currentPath = '', paths = [], valueFilter) => {
    if (Array.isArray(obj)) {
        obj.forEach((item, index) => (0, exports.getAllKeyPaths)(item, `${currentPath}[${index}]`, paths, valueFilter));
    }
    else if (obj && typeof obj === 'object') {
        for (const [key, value] of Object.entries(obj)) {
            const newPath = currentPath ? `${currentPath}.${key}` : key;
            if (typeof value === 'string' && valueFilter(value)) {
                paths.push(newPath);
            }
            else {
                (0, exports.getAllKeyPaths)(value, newPath, paths, valueFilter);
            }
        }
    }
    return paths;
};
exports.getAllKeyPaths = getAllKeyPaths;
function setMicrosoftObservabilityDefaults() {
    if (process.env.ENABLE_OBSERVABILITY === undefined || process.env.ENABLE_OBSERVABILITY === '') {
        process.env.ENABLE_OBSERVABILITY = 'true';
    }
    if (process.env.ENABLE_A365_OBSERVABILITY_EXPORTER === undefined ||
        process.env.ENABLE_A365_OBSERVABILITY_EXPORTER === '') {
        process.env.ENABLE_A365_OBSERVABILITY_EXPORTER = 'true';
    }
}
function containsExpression(testString) {
    if (!testString.startsWith('='))
        return false;
    const firstLine = testString.split(/[\r\n\u2028\u2029]/, 1)[0];
    const opening = firstLine.indexOf('{{', 1);
    return opening !== -1 && firstLine.lastIndexOf('}}') > opening + 2;
}
function isObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
async function withExpressionIsolate(workflow, fn) {
    const acquired = await workflow.expression.acquireIsolate();
    try {
        return await fn();
    }
    finally {
        if (acquired)
            await workflow.expression.releaseIsolate();
    }
}
//# sourceMappingURL=utils.js.map