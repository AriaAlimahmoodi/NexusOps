"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workflowNamingPromptTemplate = void 0;
const prompts_1 = require("@langchain/core/prompts");
const builder_1 = require("../builder");
exports.workflowNamingPromptTemplate = prompts_1.PromptTemplate.fromTemplate((0, builder_1.prompt)()
    .section('role', 'Based on the initial user prompt, please generate a name for the workflow that captures its essence and purpose')
    .section('initial_prompt', '{initialPrompt}')
    .section('output_rules', 'This name should be concise, descriptive, and suitable for a workflow that automates tasks related to the given prompt. The name should be in a format that is easy to read and understand. Do not include the word "workflow" in the name.')
    .build());
//# sourceMappingURL=workflow-name.prompt.js.map