"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compactPromptTemplate = void 0;
const prompts_1 = require("@langchain/core/prompts");
exports.compactPromptTemplate = prompts_1.PromptTemplate.fromTemplate(`Please summarize the following conversation between a user and an AI assistant building an n8n workflow:

<previous_summary>
{previousSummary}
</previous_summary>

<conversation>
{conversationText}
</conversation>

Provide a structured summary that captures the key points, decisions made, current state of the workflow, and suggested next steps.`);
//# sourceMappingURL=compact.prompt.js.map