"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ASK_ASSISTANT_TOOL = void 0;
const zod_1 = require("zod");
exports.ASK_ASSISTANT_TOOL = {
    name: 'ask_assistant',
    description: 'Ask the n8n assistant a pure knowledge question. Use this ONLY when the user needs help ' +
        'understanding n8n concepts, learning how something works, or diagnosing workflow errors. ' +
        'Do NOT use this when the user wants you to take action on their workflow — use build_workflow instead. ' +
        'NOT ask_assistant: "help me set up X", "can you fix this?", "configure the node" — these are action requests. ' +
        'After diagnosis, use build_workflow to apply any needed fix.',
    schema: zod_1.z.object({
        query: zod_1.z.string().describe('The user question to send to the assistant'),
    }),
};
//# sourceMappingURL=ask-assistant.tool.js.map