"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildToolsAgentExecutionContext = buildToolsAgentExecutionContext;
const n8n_workflow_1 = require("n8n-workflow");
const node_assert_1 = __importDefault(require("node:assert"));
const common_1 = require("../../common");
async function buildToolsAgentExecutionContext(ctx) {
    const items = ctx.getInputData();
    const batchSize = ctx.getNodeParameter('options.batching.batchSize', 0, 1);
    const delayBetweenBatches = ctx.getNodeParameter('options.batching.delayBetweenBatches', 0, 0);
    const needsFallback = ctx.getNodeParameter('needsFallback', 0, false);
    const memory = await (0, common_1.getOptionalMemory)(ctx);
    const model = await (0, common_1.getChatModel)(ctx, 0);
    (0, node_assert_1.default)(model, 'Please connect a model to the Chat Model input');
    let fallbackModel = null;
    if (needsFallback) {
        const maybeFallbackModel = await (0, common_1.getChatModel)(ctx, 1);
        if (!maybeFallbackModel) {
            throw new n8n_workflow_1.NodeOperationError(ctx.getNode(), 'Please connect a model to the Fallback Model input or disable the fallback option');
        }
        fallbackModel = maybeFallbackModel;
    }
    return {
        items,
        batchSize,
        delayBetweenBatches,
        needsFallback,
        model,
        fallbackModel,
        memory,
    };
}
//# sourceMappingURL=buildExecutionContext.js.map