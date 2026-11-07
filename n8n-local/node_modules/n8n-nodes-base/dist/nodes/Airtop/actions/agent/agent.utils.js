"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAgentDetails = getAgentDetails;
exports.validateAgentParameters = validateAgentParameters;
exports.getAgentStatus = getAgentStatus;
exports.pollAgentStatus = pollAgentStatus;
exports.throwOperationErrorIf = throwOperationErrorIf;
const n8n_workflow_1 = require("n8n-workflow");
const constants_1 = require("../../constants");
const transport_1 = require("../../transport");
/**
 * Gets the agent input parameters schema.
 */
async function getAgentDetails(agentId) {
    return await transport_1.apiRequest.call(this, 'GET', `${constants_1.BASE_URL_V2}/agents/${agentId}`);
}
/**
 * Validates the agent parameters with the schema.
 */
function validateAgentParameters(params) {
    const inputParameters = params?.value ?? {};
    const requiredParameters = (params?.schema ?? [])
        .filter((field) => field.required)
        .map((field) => field.id);
    // check for empty values on required fields
    const missingRequiredParameters = requiredParameters.filter((reqParam) => {
        return (inputParameters[reqParam] === undefined ||
            inputParameters[reqParam] === null ||
            inputParameters[reqParam] === '');
    });
    if (missingRequiredParameters.length) {
        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Missing required parameters: ${missingRequiredParameters.join(', ')}`);
    }
    return { configVars: inputParameters };
}
/**
 * Gets the agent status
 */
async function getAgentStatus(agentId, invocationId) {
    const resultUrl = `${constants_1.AIRTOP_HOOKS_BASE_URL}/agents/${agentId}/invocations/${invocationId}/result`;
    return await transport_1.apiRequest.call(this, 'GET', resultUrl);
}
/**
 * Polls the agent execution status until it's completed or fails.
 */
async function pollAgentStatus(agentId, invocationId, timeoutSeconds) {
    const airtopNode = this.getNode();
    const startTime = Date.now();
    const timeoutMs = timeoutSeconds * 1000;
    let response;
    this.logger.info(`[${airtopNode.name}] Polling agent status for invocationId: ${invocationId}`);
    while (true) {
        const elapsed = Date.now() - startTime;
        throwOperationErrorIf(elapsed >= timeoutMs, constants_1.ERROR_MESSAGES.TIMEOUT_REACHED, airtopNode);
        response = await getAgentStatus.call(this, agentId, invocationId);
        if (response?.output || response?.error) {
            return response;
        }
        // Wait one second before next poll
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
}
/**
 * Throws an operation error if the statement is true.
 */
function throwOperationErrorIf(statement, message, node) {
    if (statement) {
        throw new n8n_workflow_1.NodeOperationError(node, message);
    }
}
//# sourceMappingURL=agent.utils.js.map