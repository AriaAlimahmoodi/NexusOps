"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChainSummarizationV1 = void 0;
const prompts_1 = require("@langchain/core/prompts");
const chains_1 = require("@langchain/classic/chains");
const n8n_workflow_1 = require("n8n-workflow");
const ai_utilities_1 = require("@n8n/ai-utilities");
const prompt_1 = require("../prompt");
class ChainSummarizationV1 {
    constructor(baseDescription) {
        this.description = {
            ...baseDescription,
            version: 1,
            defaults: {
                name: 'Summarization Chain',
                color: '#909298',
            },
            inputs: [
                n8n_workflow_1.NodeConnectionTypes.Main,
                {
                    displayName: 'Model',
                    maxConnections: 1,
                    type: n8n_workflow_1.NodeConnectionTypes.AiLanguageModel,
                    required: true,
                },
                {
                    displayName: 'Document',
                    maxConnections: 1,
                    type: n8n_workflow_1.NodeConnectionTypes.AiDocument,
                    required: true,
                },
            ],
            outputs: [n8n_workflow_1.NodeConnectionTypes.Main],
            credentials: [],
            properties: [
                (0, ai_utilities_1.getTemplateNoticeField)(1951),
                {
                    displayName: 'Type',
                    name: 'type',
                    type: 'options',
                    description: 'The type of summarization to run',
                    default: 'map_reduce',
                    options: [
                        {
                            name: 'Map Reduce (Recommended)',
                            value: 'map_reduce',
                            description: 'Summarize each document (or chunk) individually, then summarize those summaries',
                        },
                        {
                            name: 'Refine',
                            value: 'refine',
                            description: 'Summarize the first document (or chunk). Then update that summary based on the next document (or chunk), and repeat.',
                        },
                        {
                            name: 'Stuff',
                            value: 'stuff',
                            description: 'Pass all documents (or chunks) at once. Ideal for small datasets.',
                        },
                    ],
                },
                {
                    displayName: 'Options',
                    name: 'options',
                    type: 'collection',
                    default: {},
                    placeholder: 'Add Option',
                    options: [
                        {
                            displayName: 'Final Prompt to Combine',
                            name: 'combineMapPrompt',
                            type: 'string',
                            hint: 'The prompt to combine individual summaries',
                            displayOptions: {
                                show: {
                                    '/type': ['map_reduce'],
                                },
                            },
                            default: prompt_1.DEFAULT_PROMPT_TEMPLATE,
                            typeOptions: {
                                rows: 6,
                            },
                        },
                        {
                            displayName: 'Individual Summary Prompt',
                            name: 'prompt',
                            type: 'string',
                            default: prompt_1.DEFAULT_PROMPT_TEMPLATE,
                            hint: 'The prompt to summarize an individual document (or chunk)',
                            displayOptions: {
                                show: {
                                    '/type': ['map_reduce'],
                                },
                            },
                            typeOptions: {
                                rows: 6,
                            },
                        },
                        {
                            displayName: 'Prompt',
                            name: 'prompt',
                            type: 'string',
                            default: prompt_1.DEFAULT_PROMPT_TEMPLATE,
                            displayOptions: {
                                show: {
                                    '/type': ['stuff'],
                                },
                            },
                            typeOptions: {
                                rows: 6,
                            },
                        },
                        {
                            displayName: 'Subsequent (Refine) Prompt',
                            name: 'refinePrompt',
                            type: 'string',
                            displayOptions: {
                                show: {
                                    '/type': ['refine'],
                                },
                            },
                            default: prompt_1.REFINE_PROMPT_TEMPLATE,
                            hint: 'The prompt to refine the summary based on the next document (or chunk)',
                            typeOptions: {
                                rows: 6,
                            },
                        },
                        {
                            displayName: 'Initial Prompt',
                            name: 'refineQuestionPrompt',
                            type: 'string',
                            displayOptions: {
                                show: {
                                    '/type': ['refine'],
                                },
                            },
                            default: prompt_1.DEFAULT_PROMPT_TEMPLATE,
                            hint: 'The prompt for the first document (or chunk)',
                            typeOptions: {
                                rows: 6,
                            },
                        },
                    ],
                },
            ],
        };
    }
    async execute() {
        this.logger.debug('Executing Vector Store QA Chain');
        const type = this.getNodeParameter('type', 0);
        const model = (await this.getInputConnectionData(n8n_workflow_1.NodeConnectionTypes.AiLanguageModel, 0));
        const documentInput = (await this.getInputConnectionData(n8n_workflow_1.NodeConnectionTypes.AiDocument, 0));
        const options = this.getNodeParameter('options', 0, {});
        const chainArgs = {
            type,
        };
        if (type === 'map_reduce') {
            const mapReduceArgs = chainArgs;
            if (options.combineMapPrompt) {
                mapReduceArgs.combineMapPrompt = new prompts_1.PromptTemplate({
                    template: options.combineMapPrompt,
                    inputVariables: ['text'],
                });
            }
            if (options.prompt) {
                mapReduceArgs.combinePrompt = new prompts_1.PromptTemplate({
                    template: options.prompt,
                    inputVariables: ['text'],
                });
            }
        }
        if (type === 'stuff') {
            const stuffArgs = chainArgs;
            if (options.prompt) {
                stuffArgs.prompt = new prompts_1.PromptTemplate({
                    template: options.prompt,
                    inputVariables: ['text'],
                });
            }
        }
        if (type === 'refine') {
            const refineArgs = chainArgs;
            if (options.refinePrompt) {
                refineArgs.refinePrompt = new prompts_1.PromptTemplate({
                    template: options.refinePrompt,
                    inputVariables: ['existing_answer', 'text'],
                });
            }
            if (options.refineQuestionPrompt) {
                refineArgs.questionPrompt = new prompts_1.PromptTemplate({
                    template: options.refineQuestionPrompt,
                    inputVariables: ['text'],
                });
            }
        }
        const chain = (0, chains_1.loadSummarizationChain)(model, chainArgs);
        const items = this.getInputData();
        const returnData = [];
        for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
            let processedDocuments;
            if (documentInput instanceof ai_utilities_1.N8nJsonLoader || documentInput instanceof ai_utilities_1.N8nBinaryLoader) {
                processedDocuments = await documentInput.processItem(items[itemIndex], itemIndex);
            }
            else {
                processedDocuments = documentInput;
            }
            const response = await chain.call({
                input_documents: processedDocuments,
            });
            returnData.push({ json: { response } });
        }
        return [returnData];
    }
}
exports.ChainSummarizationV1 = ChainSummarizationV1;
//# sourceMappingURL=ChainSummarizationV1.node.js.map