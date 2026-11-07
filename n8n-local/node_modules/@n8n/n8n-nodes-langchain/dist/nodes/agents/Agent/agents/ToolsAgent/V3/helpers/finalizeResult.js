"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.finalizeResult = finalizeResult;
const omit_1 = __importDefault(require("lodash/omit"));
const n8n_workflow_1 = require("n8n-workflow");
const agent_execution_1 = require("../../../../../../../utils/agent-execution");
function finalizeResult(result, itemIndex, memory, outputParser) {
    if (memory && outputParser) {
        const parsedOutput = (0, n8n_workflow_1.jsonParse)(result.output);
        result.output = (parsedOutput?.output ?? parsedOutput);
    }
    if (result.intermediateSteps) {
        (0, agent_execution_1.serializeIntermediateSteps)(result.intermediateSteps);
    }
    const itemResult = {
        json: (0, omit_1.default)(result, 'system_message', 'formatting_instructions', 'input', 'chat_history', 'agent_scratchpad'),
        pairedItem: { item: itemIndex },
    };
    return itemResult;
}
//# sourceMappingURL=finalizeResult.js.map