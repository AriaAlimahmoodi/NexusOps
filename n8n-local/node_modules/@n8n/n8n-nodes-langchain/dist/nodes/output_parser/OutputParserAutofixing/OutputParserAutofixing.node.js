"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutputParserAutofixing = void 0;
const prompts_1 = require("@langchain/core/prompts");
const n8n_workflow_1 = require("n8n-workflow");
const N8nOutputParser_1 = require("../../../utils/output_parsers/N8nOutputParser");
const ai_utilities_1 = require("@n8n/ai-utilities");
const prompt_1 = require("./prompt");
class OutputParserAutofixing {
    constructor() {
        this.description = {
            displayName: 'Auto-fixing Output Parser',
            name: 'outputParserAutofixing',
            icon: 'fa:tools',
            iconColor: 'black',
            group: ['transform'],
            version: 1,
            description: 'Deprecated, use structured output parser',
            defaults: {
                name: 'Auto-fixing Output Parser',
            },
            codex: {
                categories: ['AI'],
                subcategories: {
                    AI: ['Output Parsers'],
                },
                resources: {
                    primaryDocumentation: [
                        {
                            url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.outputparserautofixing/',
                        },
                    ],
                },
            },
            inputs: [
                {
                    displayName: 'Model',
                    maxConnections: 1,
                    type: n8n_workflow_1.NodeConnectionTypes.AiLanguageModel,
                    required: true,
                },
                {
                    displayName: 'Output Parser',
                    maxConnections: 1,
                    required: true,
                    type: n8n_workflow_1.NodeConnectionTypes.AiOutputParser,
                },
            ],
            outputs: [n8n_workflow_1.NodeConnectionTypes.AiOutputParser],
            outputNames: ['Output Parser'],
            builderHint: {
                inputs: {
                    ai_languageModel: { required: true },
                    ai_outputParser: { required: true },
                },
            },
            properties: [
                {
                    displayName: 'This node wraps another output parser. If the first one fails it calls an LLM to fix the format',
                    name: 'info',
                    type: 'notice',
                    default: '',
                },
                (0, ai_utilities_1.getConnectionHintNoticeField)([n8n_workflow_1.NodeConnectionTypes.AiChain, n8n_workflow_1.NodeConnectionTypes.AiAgent]),
                {
                    displayName: 'Options',
                    name: 'options',
                    type: 'collection',
                    placeholder: 'Add Option',
                    default: {},
                    options: [
                        {
                            displayName: 'Retry Prompt',
                            name: 'prompt',
                            type: 'string',
                            default: prompt_1.NAIVE_FIX_PROMPT,
                            typeOptions: {
                                rows: 10,
                            },
                            hint: 'Should include "{error}", "{instructions}", and "{completion}" placeholders',
                            description: 'Prompt template used for fixing the output. Uses placeholders: "{instructions}" for parsing rules, "{completion}" for the failed attempt, and "{error}" for the validation error message.',
                        },
                    ],
                },
            ],
        };
    }
    async supplyData(itemIndex) {
        const model = (await this.getInputConnectionData(n8n_workflow_1.NodeConnectionTypes.AiLanguageModel, itemIndex));
        const outputParser = (await this.getInputConnectionData(n8n_workflow_1.NodeConnectionTypes.AiOutputParser, itemIndex));
        const prompt = this.getNodeParameter('options.prompt', itemIndex, prompt_1.NAIVE_FIX_PROMPT);
        if (prompt.length === 0 || !prompt.includes('{error}')) {
            throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Auto-fixing parser prompt has to contain {error} placeholder');
        }
        const parser = new N8nOutputParser_1.N8nOutputFixingParser(this, model, outputParser, prompts_1.PromptTemplate.fromTemplate(prompt));
        return {
            response: parser,
        };
    }
}
exports.OutputParserAutofixing = OutputParserAutofixing;
//# sourceMappingURL=OutputParserAutofixing.node.js.map