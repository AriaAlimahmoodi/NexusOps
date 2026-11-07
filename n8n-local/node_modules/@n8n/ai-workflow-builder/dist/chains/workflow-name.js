"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.workflowNameChain = workflowNameChain;
const zod_1 = __importDefault(require("zod"));
const workflow_name_prompt_1 = require("../prompts/chains/workflow-name.prompt");
async function workflowNameChain(llm, initialPrompt, config) {
    const nameSchema = zod_1.default.object({
        name: zod_1.default.string().min(10).max(128).describe('Name of the workflow based on the prompt'),
    });
    const modelWithStructure = llm.withStructuredOutput(nameSchema);
    const prompt = await workflow_name_prompt_1.workflowNamingPromptTemplate.invoke({
        initialPrompt,
    });
    const rawOutput = await modelWithStructure.invoke(prompt, config);
    const structuredOutput = nameSchema.parse(rawOutput);
    return {
        name: structuredOutput.name,
    };
}
//# sourceMappingURL=workflow-name.js.map