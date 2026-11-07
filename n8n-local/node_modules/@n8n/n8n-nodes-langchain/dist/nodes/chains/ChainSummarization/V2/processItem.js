"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processItem = processItem;
const textsplitters_1 = require("@langchain/textsplitters");
const chains_1 = require("@langchain/classic/chains");
const n8n_workflow_1 = require("n8n-workflow");
const ai_utilities_1 = require("@n8n/ai-utilities");
const tracing_1 = require("../../../../utils/tracing");
const helpers_1 = require("../helpers");
async function processItem(ctx, itemIndex, item, operationMode, chunkingMode) {
    const model = (await ctx.getInputConnectionData(n8n_workflow_1.NodeConnectionTypes.AiLanguageModel, 0));
    const summarizationMethodAndPrompts = ctx.getNodeParameter('options.summarizationMethodAndPrompts.values', itemIndex, {});
    const chainArgs = (0, helpers_1.getChainPromptsArgs)(summarizationMethodAndPrompts.summarizationMethod ?? 'map_reduce', summarizationMethodAndPrompts);
    const chain = (0, chains_1.loadSummarizationChain)(model, chainArgs);
    let processedDocuments;
    if (operationMode === 'documentLoader') {
        const documentInput = (await ctx.getInputConnectionData(n8n_workflow_1.NodeConnectionTypes.AiDocument, 0));
        const isN8nLoader = documentInput instanceof ai_utilities_1.N8nJsonLoader || documentInput instanceof ai_utilities_1.N8nBinaryLoader;
        processedDocuments = isN8nLoader
            ? await documentInput.processItem(item, itemIndex)
            : documentInput;
        return await chain.withConfig((0, tracing_1.getTracingConfig)(ctx)).invoke({
            input_documents: processedDocuments,
        });
    }
    else if (['nodeInputJson', 'nodeInputBinary'].includes(operationMode)) {
        let textSplitter;
        switch (chunkingMode) {
            case 'simple':
                const chunkSize = ctx.getNodeParameter('chunkSize', itemIndex, 1000);
                const chunkOverlap = ctx.getNodeParameter('chunkOverlap', itemIndex, 200);
                textSplitter = new textsplitters_1.RecursiveCharacterTextSplitter({ chunkOverlap, chunkSize });
                break;
            case 'advanced':
                textSplitter = (await ctx.getInputConnectionData(n8n_workflow_1.NodeConnectionTypes.AiTextSplitter, 0));
                break;
            default:
                break;
        }
        let processor;
        if (operationMode === 'nodeInputBinary') {
            const binaryDataKey = ctx.getNodeParameter('options.binaryDataKey', itemIndex, 'data');
            processor = new ai_utilities_1.N8nBinaryLoader(ctx, 'options.', binaryDataKey, textSplitter);
        }
        else {
            processor = new ai_utilities_1.N8nJsonLoader(ctx, 'options.', textSplitter);
        }
        const processedItem = await processor.processItem(item, itemIndex);
        return await chain.invoke({
            input_documents: processedItem,
        }, { signal: ctx.getExecutionCancelSignal() });
    }
    return undefined;
}
//# sourceMappingURL=processItem.js.map