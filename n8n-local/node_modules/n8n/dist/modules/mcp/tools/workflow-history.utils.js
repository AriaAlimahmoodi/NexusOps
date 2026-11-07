"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMcpWorkflowVersion = getMcpWorkflowVersion;
const workflow_history_version_not_found_error_1 = require("../../../errors/workflow-history-version-not-found.error");
async function getMcpWorkflowVersion(workflowHistoryService, user, workflowId, versionId) {
    try {
        return await workflowHistoryService.getVersion(user, workflowId, versionId, {
            publishHistory: 'none',
        });
    }
    catch (error) {
        if (error instanceof workflow_history_version_not_found_error_1.WorkflowHistoryVersionNotFoundError) {
            throw new Error(`Version '${versionId}' was not found for this workflow. It may have been pruned by workflow history retention.`);
        }
        throw error;
    }
}
//# sourceMappingURL=workflow-history.utils.js.map