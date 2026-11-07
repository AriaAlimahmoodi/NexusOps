"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectMissingNodeTypes = collectMissingNodeTypes;
exports.missingNodeTypeBlockingFailures = missingNodeTypeBlockingFailures;
exports.workflowsWithMissingNodeTypes = workflowsWithMissingNodeTypes;
const node_type_usage_1 = require("./node-type-usage");
const requirement_consumers_1 = require("../../spec/requirement-consumers");
function collectMissingNodeTypes(workflows, getSupportedVersions) {
    const usage = (0, node_type_usage_1.collectNodeTypeUsage)(workflows.map(({ entity, sourceWorkflowId }) => ({
        workflowId: sourceWorkflowId,
        nodes: entity.nodes,
    })));
    const supportedByType = new Map();
    return usage.filter(({ type, typeVersion }) => {
        if (!supportedByType.has(type)) {
            supportedByType.set(type, getSupportedVersions(type));
        }
        return !supportedByType.get(type)?.includes(typeVersion);
    });
}
const BLOCKING_FAILURES = {
    fail: (missing) => missing,
    'import-anyway': () => [],
};
function missingNodeTypeBlockingFailures(mode, missing) {
    return BLOCKING_FAILURES[mode](missing);
}
function workflowsWithMissingNodeTypes(missing) {
    return new Set(missing.flatMap(requirement_consumers_1.getWorkflowConsumerIds));
}
//# sourceMappingURL=missing-node-type-mode.js.map