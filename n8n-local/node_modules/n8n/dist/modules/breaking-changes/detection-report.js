"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOT_AFFECTED_INSTANCE = void 0;
exports.reportAffectedNodes = reportAffectedNodes;
exports.NOT_AFFECTED_INSTANCE = {
    isAffected: false,
    instanceIssues: [],
    recommendations: [],
};
function reportAffectedNodes(nodes, toIssue) {
    if (nodes.length === 0)
        return { isAffected: false, issues: [] };
    return {
        isAffected: true,
        issues: nodes.map((node) => ({ ...toIssue(node), nodeId: node.id, nodeName: node.name })),
    };
}
//# sourceMappingURL=detection-report.js.map