"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promptCategorizationChain = promptCategorizationChain;
const zod_1 = require("zod");
const categorization_prompt_1 = require("../prompts/chains/categorization.prompt");
const categorization_1 = require("../types/categorization");
async function promptCategorizationChain(llm, userPrompt) {
    const categorizationSchema = zod_1.z.object({
        techniques: zod_1.z
            .array(zod_1.z.nativeEnum(categorization_1.WorkflowTechnique))
            .min(0)
            .describe('Workflow techniques identified in the prompt'),
        confidence: zod_1.z
            .number()
            .min(0)
            .max(1)
            .describe('Confidence level in this categorization from 0.0 to 1.0'),
    });
    const modelWithStructure = llm.withStructuredOutput(categorizationSchema);
    const prompt = await categorization_prompt_1.promptCategorizationTemplate.invoke({
        userPrompt,
        techniques: (0, categorization_prompt_1.formatTechniqueList)(),
    });
    const structuredOutput = await modelWithStructure.invoke(prompt);
    return {
        techniques: structuredOutput.techniques,
        confidence: structuredOutput.confidence,
    };
}
//# sourceMappingURL=prompt-categorization.js.map