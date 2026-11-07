"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.planAndExecuteAgentExecute = planAndExecuteAgentExecute;
const prompts_1 = require("@langchain/core/prompts");
const plan_and_execute_1 = require("@langchain/classic/experimental/plan_and_execute");
const n8n_workflow_1 = require("n8n-workflow");
const helpers_1 = require("../../../../../utils/helpers");
const N8nOutputParser_1 = require("../../../../../utils/output_parsers/N8nOutputParser");
const schemaParsing_1 = require("../../../../../utils/schemaParsing");
const tracing_1 = require("../../../../../utils/tracing");
const utils_1 = require("../utils");
async function planAndExecuteAgentExecute(nodeVersion) {
    this.logger.debug('Executing PlanAndExecute Agent');
    const model = (await this.getInputConnectionData(n8n_workflow_1.NodeConnectionTypes.AiLanguageModel, 0));
    const tools = await (0, helpers_1.getConnectedTools)(this, nodeVersion >= 1.5, true, true);
    await (0, utils_1.checkForStructuredTools)(tools, this.getNode(), 'Plan & Execute Agent');
    const outputParser = await (0, N8nOutputParser_1.getOptionalOutputParser)(this);
    const options = this.getNodeParameter('options', 0, {});
    const additionalMetadata = (0, tracing_1.buildTracingMetadata)(options.tracingMetadata?.values, this.logger);
    if (Object.keys(additionalMetadata).length > 0) {
        this.logger.debug('Tracing metadata', { additionalMetadata });
    }
    const tracingConfig = (0, tracing_1.getTracingConfig)(this, { additionalMetadata });
    const agentExecutor = await plan_and_execute_1.PlanAndExecuteAgentExecutor.fromLLMAndTools({
        llm: model,
        tools,
        humanMessageTemplate: options.humanMessageTemplate,
    });
    const returnData = [];
    let prompt;
    if (outputParser) {
        const formatInstructions = outputParser.getFormatInstructions();
        prompt = new prompts_1.PromptTemplate({
            template: '{input}\n{formatInstructions}',
            inputVariables: ['input'],
            partialVariables: { formatInstructions },
        });
    }
    const items = this.getInputData();
    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
        try {
            let input;
            if (this.getNode().typeVersion <= 1.2) {
                input = this.getNodeParameter('text', itemIndex);
            }
            else {
                input = (0, helpers_1.getPromptInputByType)({
                    ctx: this,
                    i: itemIndex,
                    inputKey: 'text',
                    promptTypeKey: 'promptType',
                });
            }
            if (input === undefined) {
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'The ‘text‘ parameter is empty.');
            }
            if (prompt) {
                input = (await prompt.invoke({ input })).value;
            }
            const response = await agentExecutor
                .withConfig(tracingConfig)
                .invoke({ input, outputParser });
            if (outputParser) {
                response.output = await (0, utils_1.extractParsedOutput)(this, outputParser, response.output);
            }
            returnData.push({ json: response });
        }
        catch (error) {
            (0, schemaParsing_1.throwIfToolSchema)(this, error);
            if (this.continueOnFail()) {
                returnData.push({ json: { error: error.message }, pairedItem: { item: itemIndex } });
                continue;
            }
            throw error;
        }
    }
    return [returnData];
}
//# sourceMappingURL=execute.js.map