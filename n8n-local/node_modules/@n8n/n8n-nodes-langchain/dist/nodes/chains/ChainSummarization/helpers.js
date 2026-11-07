"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChainPromptsArgs = getChainPromptsArgs;
const prompts_1 = require("@langchain/core/prompts");
function getChainPromptsArgs(type, options) {
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
    return chainArgs;
}
//# sourceMappingURL=helpers.js.map