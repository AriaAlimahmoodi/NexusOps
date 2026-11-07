"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationCompactChain = conversationCompactChain;
const messages_1 = require("@langchain/core/messages");
const zod_1 = __importDefault(require("zod"));
const compact_prompt_1 = require("../prompts/chains/compact.prompt");
async function conversationCompactChain(llm, messages, previousSummary = '', config) {
    const CompactedSession = zod_1.default.object({
        summary: zod_1.default.string().describe('A concise summary of the conversation so far'),
        key_decisions: zod_1.default.array(zod_1.default.string()).describe('List of key decisions and actions taken'),
        current_state: zod_1.default.string().describe('Description of the current workflow state'),
        next_steps: zod_1.default.string().describe('Suggested next steps based on the conversation'),
    });
    const modelWithStructure = llm.withStructuredOutput(CompactedSession);
    const conversationText = messages
        .map((msg) => {
        if (msg instanceof messages_1.HumanMessage) {
            return `User: ${msg.content}`;
        }
        else if (msg instanceof messages_1.AIMessage) {
            if (typeof msg.content === 'string') {
                return `Assistant: ${msg.content}`;
            }
            else {
                return 'Assistant: Used tools';
            }
        }
        return '';
    })
        .filter(Boolean)
        .join('\n');
    const compactPrompt = await compact_prompt_1.compactPromptTemplate.invoke({
        previousSummary,
        conversationText,
    });
    const structuredOutput = await modelWithStructure.invoke(compactPrompt, config);
    const formattedSummary = `## Previous Conversation Summary

**Summary:** ${structuredOutput.summary}

**Key Decisions:**
${structuredOutput.key_decisions.map((d) => `- ${d}`).join('\n')}

**Current State:** ${structuredOutput.current_state}

**Next Steps:** ${structuredOutput.next_steps}`;
    return {
        success: true,
        summary: structuredOutput,
        summaryPlain: formattedSummary,
    };
}
//# sourceMappingURL=conversation-compact.js.map