"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInputDataTool = createInputDataTool;
const tool_1 = require("@n8n/agents/tool");
const zod_1 = require("zod");
const agent_data_utils_1 = require("./agent-data-utils");
const DESCRIPTION = 'Read the data passed into this agent step. ' +
    'Call without arguments for the input items (trimmed if large). ' +
    'Pass a JMESPath query to retrieve a specific part of the input, untrimmed.';
const WORKFLOW_INVOCATION_INSTRUCTIONS = 'This is a non-streaming step inside an n8n workflow. Complete all required work and tool calls without sending progress updates, narrating actions, or exposing internal reasoning. After the work is complete, return exactly one self-contained final response containing only the result needed by downstream workflow nodes.';
function createInputDataTool(context) {
    const items = context.inputData ?? [];
    const scope = context.inputDataScope ?? 'item';
    const workflowLabel = context.workflowName ?? context.workflowId ?? 'unknown';
    const scopeText = scope === 'all' ? 'all input items' : 'the current input item';
    return (new tool_1.Tool('fetch_input_data')
        .description(DESCRIPTION)
        .input(zod_1.z.object({
        query: zod_1.z
            .string()
            .optional()
            .describe(`JMESPath query to retrieve a specific part of the input, untrimmed. ${agent_data_utils_1.ITEM_SHAPE_HINT} ${agent_data_utils_1.QUERY_WHEN_TRUNCATED_HINT}`),
    }))
        .systemInstruction(`${WORKFLOW_INVOCATION_INSTRUCTIONS} You were invoked from the n8n workflow '${workflowLabel}' by its node '${context.callingNodeName}'. ` +
        `Call fetch_input_data to read the data passed into this step (${scopeText}); use it whenever ` +
        `the message references the input. ${agent_data_utils_1.ITEM_SHAPE_HINT} ${agent_data_utils_1.QUERY_WHEN_TRUNCATED_HINT}`)
        .handler(async ({ query }) => {
        try {
            if (query) {
                return { query, ...(0, agent_data_utils_1.queryItems)(items, query) };
            }
            const { items: trimmed, truncated } = (0, agent_data_utils_1.trimItems)(items);
            return { scope, totalItems: items.length, items: trimmed, truncated };
        }
        catch (error) {
            return { error: `Failed to read input data: ${error.message}` };
        }
    })
        .build());
}
//# sourceMappingURL=input-data-tool.js.map