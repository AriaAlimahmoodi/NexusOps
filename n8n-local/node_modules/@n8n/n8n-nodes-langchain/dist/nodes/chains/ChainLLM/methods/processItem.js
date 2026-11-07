"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processItem = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const node_assert_1 = __importDefault(require("node:assert"));
const helpers_1 = require("../../../../utils/helpers");
const N8nOutputParser_1 = require("../../../../utils/output_parsers/N8nOutputParser");
const chainExecutor_1 = require("./chainExecutor");
async function getChatModel(ctx, index = 0) {
    const connectedModels = await ctx.getInputConnectionData(n8n_workflow_1.NodeConnectionTypes.AiLanguageModel, 0);
    let model;
    if (Array.isArray(connectedModels) && index !== undefined) {
        if (connectedModels.length <= index) {
            return undefined;
        }
        const reversedModels = [...connectedModels].reverse();
        model = reversedModels[index];
    }
    else {
        model = connectedModels;
    }
    return model;
}
const processItem = async (ctx, itemIndex) => {
    const needsFallback = ctx.getNodeParameter('needsFallback', 0, false);
    const llm = await getChatModel(ctx, 0);
    (0, node_assert_1.default)(llm, 'Please connect a model to the Chat Model input');
    const fallbackLlm = needsFallback ? await getChatModel(ctx, 1) : null;
    if (needsFallback && !fallbackLlm) {
        throw new n8n_workflow_1.NodeOperationError(ctx.getNode(), 'Please connect a model to the Fallback Model input or disable the fallback option');
    }
    const outputParser = await (0, N8nOutputParser_1.getOptionalOutputParser)(ctx, itemIndex);
    let prompt;
    if (ctx.getNode().typeVersion <= 1.3) {
        prompt = ctx.getNodeParameter('prompt', itemIndex);
    }
    else {
        prompt = (0, helpers_1.getPromptInputByType)({
            ctx,
            i: itemIndex,
            inputKey: 'text',
            promptTypeKey: 'promptType',
        });
    }
    if (prompt === undefined) {
        throw new n8n_workflow_1.NodeOperationError(ctx.getNode(), "The 'prompt' parameter is empty.");
    }
    const messages = ctx.getNodeParameter('messages.messageValues', itemIndex, []);
    return await (0, chainExecutor_1.executeChain)({
        context: ctx,
        itemIndex,
        query: prompt,
        llm,
        outputParser,
        messages,
        fallbackLlm,
    });
};
exports.processItem = processItem;
//# sourceMappingURL=processItem.js.map