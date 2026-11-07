"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invokeAgent = invokeAgent;
const n8n_workflow_1 = require("n8n-workflow");
const common_1 = require("../../agents/Agent/agents/ToolsAgent/common");
const prompt_1 = require("../../agents/Agent/agents/ConversationalAgent/prompt");
const execute_1 = require("../../agents/Agent/agents/ToolsAgent/V2/execute");
const N8nOutputParser_1 = require("../../../utils/output_parsers/N8nOutputParser");
async function invokeAgent(nodeContext, input, systemMessage, invokeOptions = {}, microsoftMcpToolkits = []) {
    const conversationId = invokeOptions.configurable
        ?.thread_id;
    if (conversationId) {
        const req = nodeContext.getRequestObject();
        if (req.body && typeof req.body === 'object') {
            req.body.sessionId = conversationId;
        }
    }
    const needsFallback = nodeContext.getNodeParameter('needsFallback', false);
    const memory = await (0, common_1.getOptionalMemory)(nodeContext);
    const model = await (0, common_1.getChatModel)(nodeContext, 0);
    (0, n8n_workflow_1.assert)(model, 'Please connect a model to the Chat Model input');
    const fallbackModel = needsFallback ? await (0, common_1.getChatModel)(nodeContext, 1) : null;
    if (needsFallback && !fallbackModel) {
        throw new n8n_workflow_1.NodeOperationError(nodeContext.getNode(), 'Please connect a model to the Fallback Model input or disable the fallback option');
    }
    const outputParser = await (0, N8nOutputParser_1.getOptionalOutputParser)(nodeContext, 0);
    let tools = await (0, common_1.getTools)(nodeContext, outputParser);
    if (microsoftMcpToolkits?.length) {
        tools = tools.concat(microsoftMcpToolkits.flatMap((toolkit) => toolkit.tools));
    }
    const options = nodeContext.getNodeParameter('options', {});
    if (systemMessage) {
        options.systemMessage = systemMessage;
    }
    if (options.maxIterations === undefined) {
        options.maxIterations = 10;
    }
    const messages = await prepareMessages({
        systemMessage: options.systemMessage,
        outputParser,
    });
    const prompt = (0, common_1.preparePrompt)(messages);
    const executor = (0, execute_1.createAgentExecutor)(model, tools, prompt, options, outputParser, memory, fallbackModel);
    const system_message = options.systemMessage ?? prompt_1.SYSTEM_MESSAGE;
    const invokeParams = {
        input,
        system_message,
        formatting_instructions: 'IMPORTANT: For your response to user, you MUST use the `format_final_json_response` tool with your complete answer formatted according to the required schema. Do not attempt to format the JSON manually - always use this tool. Your response will be rejected if it is not properly formatted through this tool. Only use this tool once you are ready to provide your final answer.',
    };
    const result = await executor.invoke(invokeParams, invokeOptions);
    if (result.status === 'rejected') {
        const error = result.reason;
        throw new n8n_workflow_1.NodeOperationError(nodeContext.getNode(), error);
    }
    const response = result;
    if (memory && outputParser) {
        const parsedOutput = (0, n8n_workflow_1.jsonParse)(response.output);
        response.output = parsedOutput?.output ?? parsedOutput;
    }
    return response.output;
}
async function prepareMessages(options) {
    const messages = [];
    if (options.systemMessage) {
        messages.push([
            'system',
            `{system_message}${options.outputParser ? '\n\n{formatting_instructions}' : ''}`,
        ]);
    }
    else if (options.outputParser) {
        messages.push(['system', '{formatting_instructions}']);
    }
    messages.push([
        'system',
        `{system_message}${options.outputParser ? '\n\n{formatting_instructions}' : ''}`,
    ]);
    messages.push(['placeholder', '{chat_history}'], ['human', '{input}']);
    messages.push(['placeholder', '{agent_scratchpad}']);
    return messages;
}
//# sourceMappingURL=langchain-utils.js.map