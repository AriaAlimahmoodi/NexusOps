"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSdkReferenceHint = getSdkReferenceHint;
exports.validateMcpWorkflow = validateMcpWorkflow;
exports.getMcpWorkflow = getMcpWorkflow;
const backend_services_1 = require("@n8n/backend-services");
const di_1 = require("@n8n/di");
const mcp_errors_1 = require("../mcp.errors");
const constants_1 = require("./workflow-builder/constants");
function getSdkReferenceHint(error, options = {}) {
    const isParseError = error instanceof Error &&
        (error.name === 'WorkflowCodeParseError' || error instanceof SyntaxError);
    if (!isParseError)
        return undefined;
    const afterReference = options.afterReference ??
        `Rewrite the code using the documented patterns, then call ${constants_1.CODE_BUILDER_VALIDATE_TOOL.toolName} again before creating or updating a workflow.`;
    return `The code failed to parse as n8n Workflow SDK code. This usually means it does not follow the required SDK patterns. Before retrying, call ${constants_1.MCP_GET_SDK_REFERENCE_TOOL.toolName} to read the Workflow SDK reference. Use workflow(), trigger()/node(), .add()/.to(), expr(), and newCredential() exactly as documented. ${afterReference}`;
}
function getWorkflowSettingsUrl(workflowId) {
    const baseUrl = di_1.Container.get(backend_services_1.UrlService).getInstanceBaseUrl();
    return `${baseUrl}/workflow/${encodeURIComponent(workflowId)}?settings=true`;
}
function validateMcpWorkflow(workflow) {
    if (!workflow) {
        throw new mcp_errors_1.WorkflowAccessError("Workflow not found or you don't have permission to access it.", 'no_permission');
    }
    if (workflow.isArchived) {
        throw new mcp_errors_1.WorkflowAccessError(`Workflow '${workflow.id}' is archived and cannot be accessed.`, 'workflow_archived');
    }
    if (!workflow.settings?.availableInMCP) {
        throw new mcp_errors_1.WorkflowAccessError(`Workflow is not available in MCP. Enable MCP access from the workflow card in the workflows list, or from the workflow settings: ${getWorkflowSettingsUrl(workflow.id)}`, 'not_available_in_mcp');
    }
    return workflow;
}
async function getMcpWorkflow(workflowId, user, scopes, workflowFinderService, options) {
    const workflow = await workflowFinderService.findWorkflowForUser(workflowId, user, scopes, options ?? {});
    return validateMcpWorkflow(workflow);
}
//# sourceMappingURL=workflow-validation.utils.js.map