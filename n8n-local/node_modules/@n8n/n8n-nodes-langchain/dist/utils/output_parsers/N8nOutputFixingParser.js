"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.N8nOutputFixingParser = void 0;
const output_parsers_1 = require("@langchain/core/output_parsers");
const n8n_workflow_1 = require("n8n-workflow");
const ai_utilities_1 = require("@n8n/ai-utilities");
class N8nOutputFixingParser extends output_parsers_1.BaseOutputParser {
    constructor(context, model, outputParser, fixPromptTemplate) {
        super();
        this.context = context;
        this.model = model;
        this.outputParser = outputParser;
        this.fixPromptTemplate = fixPromptTemplate;
        this.lc_namespace = ['langchain', 'output_parsers', 'fix'];
    }
    getRetryChain() {
        return this.fixPromptTemplate.pipe(this.model);
    }
    async parse(completion, callbacks) {
        const { index } = this.context.addInputData(n8n_workflow_1.NodeConnectionTypes.AiOutputParser, [
            [{ json: { action: 'parse', text: completion } }],
        ]);
        try {
            const response = await this.outputParser.parse(completion, callbacks, (e) => {
                if (e instanceof output_parsers_1.OutputParserException) {
                    return e;
                }
                return new output_parsers_1.OutputParserException(e.message, completion);
            });
            (0, ai_utilities_1.logAiEvent)(this.context, 'ai-output-parsed', { text: completion, response });
            this.context.addOutputData(n8n_workflow_1.NodeConnectionTypes.AiOutputParser, index, [
                [{ json: { action: 'parse', response } }],
            ]);
            return response;
        }
        catch (error) {
            if (!(error instanceof output_parsers_1.OutputParserException)) {
                throw error;
            }
            try {
                const result = (await this.getRetryChain().invoke({
                    completion,
                    error: error.message,
                    instructions: this.getFormatInstructions(),
                }));
                const resultText = result.content.toString();
                const parsed = await this.outputParser.parse(resultText, callbacks);
                this.context.addOutputData(n8n_workflow_1.NodeConnectionTypes.AiOutputParser, index, [
                    [{ json: { action: 'parse', response: parsed } }],
                ]);
                return parsed;
            }
            catch (autoParseError) {
                this.context.addOutputData(n8n_workflow_1.NodeConnectionTypes.AiOutputParser, index, autoParseError);
                throw autoParseError;
            }
        }
    }
    getFormatInstructions() {
        return this.outputParser.getFormatInstructions();
    }
    getSchema() {
        return this.outputParser.schema;
    }
}
exports.N8nOutputFixingParser = N8nOutputFixingParser;
//# sourceMappingURL=N8nOutputFixingParser.js.map