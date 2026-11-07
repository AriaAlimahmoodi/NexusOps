"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processItem = void 0;
const prompts_1 = require("@langchain/core/prompts");
const combine_documents_1 = require("@langchain/classic/chains/combine_documents");
const retrieval_1 = require("@langchain/classic/chains/retrieval");
const n8n_workflow_1 = require("n8n-workflow");
const ai_utilities_1 = require("@n8n/ai-utilities");
const helpers_1 = require("../../../utils/helpers");
const tracing_1 = require("../../../utils/tracing");
const constants_1 = require("./constants");
const processItem = async (ctx, itemIndex) => {
    const model = (await ctx.getInputConnectionData(n8n_workflow_1.NodeConnectionTypes.AiLanguageModel, 0));
    const retriever = (await ctx.getInputConnectionData(n8n_workflow_1.NodeConnectionTypes.AiRetriever, 0));
    let query;
    if (ctx.getNode().typeVersion <= 1.2) {
        query = ctx.getNodeParameter('query', itemIndex);
    }
    else {
        query = (0, helpers_1.getPromptInputByType)({
            ctx,
            i: itemIndex,
            inputKey: 'text',
            promptTypeKey: 'promptType',
        });
    }
    if (query === undefined) {
        throw new n8n_workflow_1.NodeOperationError(ctx.getNode(), 'The ‘query‘ parameter is empty.');
    }
    const options = ctx.getNodeParameter('options', itemIndex, {});
    let templateText = options.systemPromptTemplate ?? constants_1.SYSTEM_PROMPT_TEMPLATE;
    if (ctx.getNode().typeVersion < 1.5) {
        templateText = templateText.replace(`{${constants_1.LEGACY_INPUT_TEMPLATE_KEY}}`, `{${constants_1.INPUT_TEMPLATE_KEY}}`);
    }
    let promptTemplate;
    if ((0, ai_utilities_1.isChatInstance)(model)) {
        const messages = [
            prompts_1.SystemMessagePromptTemplate.fromTemplate(templateText),
            prompts_1.HumanMessagePromptTemplate.fromTemplate('{input}'),
        ];
        promptTemplate = prompts_1.ChatPromptTemplate.fromMessages(messages);
    }
    else {
        const questionSuffix = options.systemPromptTemplate === undefined ? '\n\nQuestion: {input}\nAnswer:' : '';
        promptTemplate = new prompts_1.PromptTemplate({
            template: templateText + questionSuffix,
            inputVariables: ['context', 'input'],
        });
    }
    const combineDocsChain = await (0, combine_documents_1.createStuffDocumentsChain)({
        llm: model,
        prompt: promptTemplate,
    });
    const retrievalChain = await (0, retrieval_1.createRetrievalChain)({
        combineDocsChain,
        retriever,
    });
    const tracingConfig = (0, tracing_1.getTracingConfig)(ctx);
    return await retrievalChain
        .withConfig(tracingConfig)
        .invoke({ input: query }, { signal: ctx.getExecutionCancelSignal() });
};
exports.processItem = processItem;
//# sourceMappingURL=processItem.js.map