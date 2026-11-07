"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.programmaticValidation = programmaticValidation;
const checks_1 = require("../validation/checks");
function programmaticValidation(input, nodeTypes) {
    const { generatedWorkflow } = input;
    const connectionsValidationResult = (0, checks_1.validateConnections)(generatedWorkflow, nodeTypes);
    const nodesValidationResult = (0, checks_1.validateNodes)(generatedWorkflow, nodeTypes);
    const triggerValidationResult = (0, checks_1.validateTrigger)(generatedWorkflow, nodeTypes);
    const agentPromptValidationResult = (0, checks_1.validateAgentPrompt)(generatedWorkflow);
    const toolsValidationResult = (0, checks_1.validateTools)(generatedWorkflow, nodeTypes);
    const fromAiValidationResult = (0, checks_1.validateFromAi)(generatedWorkflow, nodeTypes);
    const credentialsValidationResult = (0, checks_1.validateCredentials)(generatedWorkflow);
    const nodeUsageValidationResult = (0, checks_1.validateWebhookResponse)(generatedWorkflow);
    const parametersValidationResult = (0, checks_1.validateParameters)(generatedWorkflow, nodeTypes);
    return {
        connections: connectionsValidationResult,
        nodes: nodesValidationResult,
        trigger: triggerValidationResult,
        agentPrompt: agentPromptValidationResult,
        tools: toolsValidationResult,
        fromAi: fromAiValidationResult,
        credentials: credentialsValidationResult,
        nodeUsage: nodeUsageValidationResult,
        parameters: parametersValidationResult,
    };
}
//# sourceMappingURL=programmatic.js.map