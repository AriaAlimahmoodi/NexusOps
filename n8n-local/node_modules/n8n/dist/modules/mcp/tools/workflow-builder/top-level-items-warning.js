"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.summarizeUngroupedNodeNames = summarizeUngroupedNodeNames;
exports.topLevelItemsWarning = topLevelItemsWarning;
const n8n_workflow_1 = require("n8n-workflow");
const summarize = (workflow) => (0, n8n_workflow_1.summarizeTopLevelItems)({
    nodes: workflow.nodes,
    nodeGroups: workflow.nodeGroups,
    connectionsBySourceNode: workflow.connections,
});
function summarizeUngroupedNodeNames(workflow) {
    return summarize(workflow).ungroupedNodeNames;
}
function topLevelItemsWarning(workflow) {
    const summary = summarize(workflow);
    if (!summary.overCeiling) {
        return undefined;
    }
    return {
        code: n8n_workflow_1.TOP_LEVEL_ITEMS_OVER_CEILING_CODE,
        message: (0, n8n_workflow_1.formatTopLevelItemsMessage)(summary),
    };
}
//# sourceMappingURL=top-level-items-warning.js.map