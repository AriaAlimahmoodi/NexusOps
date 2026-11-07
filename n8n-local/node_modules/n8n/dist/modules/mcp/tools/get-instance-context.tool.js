"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.INSTANCE_CONTEXT_RESOURCE_DESCRIPTION = exports.createGetInstanceContextTool = exports.NOTHING_EXPOSED_TEXT = exports.EMPTY_INSTANCE_CONTEXT_TEXT = exports.INSTANCE_CONTEXT_RESOURCE_URI = exports.GET_INSTANCE_CONTEXT_TOOL_NAME = void 0;
exports.readInstanceContext = readInstanceContext;
exports.instanceContextText = instanceContextText;
const zod_1 = __importDefault(require("zod"));
const mcp_constants_1 = require("../mcp.constants");
exports.GET_INSTANCE_CONTEXT_TOOL_NAME = 'get_instance_context';
exports.INSTANCE_CONTEXT_RESOURCE_URI = 'n8n://instance/context';
exports.EMPTY_INSTANCE_CONTEXT_TEXT = 'Nothing has been built on this instance yet.';
exports.NOTHING_EXPOSED_TEXT = 'No workflows on this instance are available in MCP, so there is nothing to report here. ' +
    'Ask the user to enable MCP access for a workflow in Settings, under Instance-level MCP.';
const DESCRIPTION = 'Read the opening picture of this n8n instance: which workflows exist, what has recently been ' +
    'created, changed or deleted, and what has run and failed. Call it once at the start of a ' +
    'session, before asking the user what they want to do — when they are vague ("fix it", ' +
    '"carry on"), the answer is usually the most recent thing here. Returns prose, not records: ' +
    'pass the workflow ids it names to search_workflows or get_workflow_details, and a bracketed ' +
    'activity id to expand_instance_activity. get_instance_activity pages further back.';
const inputSchema = {
    projectId: zod_1.default
        .string()
        .min(1)
        .optional()
        .describe('Read one project instead of every project you can see. Obtain it from search_projects.'),
};
const outputSchema = {
    context: zod_1.default
        .string()
        .optional()
        .describe('The instance context, as prose. Absent when there is nothing to report.'),
    empty: zod_1.default
        .boolean()
        .optional()
        .describe('Set when there is nothing to report. Read `nothingExposed` for the reason.'),
    nothingExposed: zod_1.default
        .boolean()
        .optional()
        .describe('Present when the answer is empty. True means workflows exist here but none are available in MCP, so the estate is real and simply out of reach — do not treat it as a fresh instance. False means the instance genuinely holds nothing yet.'),
};
async function readInstanceContext(user, instanceContext, options, projectId) {
    const scope = buildScope(options.executionGranted, projectId);
    const built = await instanceContext.buildBlock({ user, scope, cursor: null, enabled: true });
    if (built.state === 'injected')
        return { kind: 'context', text: built.block };
    return (await instanceContext.hasWithheldWorkflows(user, scope))
        ? { kind: 'withheld' }
        : { kind: 'empty' };
}
function instanceContextText(read) {
    if (read.kind === 'context')
        return read.text;
    return read.kind === 'withheld' ? exports.NOTHING_EXPOSED_TEXT : exports.EMPTY_INSTANCE_CONTEXT_TEXT;
}
const buildScope = (executionGranted, projectId) => ({
    surface: 'mcp',
    executionGranted,
    credentialGranted: false,
    ...(projectId !== undefined ? { projectId } : {}),
});
const createGetInstanceContextTool = (user, instanceContext, telemetry, options) => ({
    name: exports.GET_INSTANCE_CONTEXT_TOOL_NAME,
    config: {
        description: DESCRIPTION,
        inputSchema,
        outputSchema,
        annotations: {
            title: 'Get Instance Context',
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    },
    handler: async ({ projectId }) => {
        const telemetryPayload = {
            user_id: user.id,
            tool_name: exports.GET_INSTANCE_CONTEXT_TOOL_NAME,
            parameters: { projectId },
        };
        try {
            const read = await readInstanceContext(user, instanceContext, options, projectId);
            const text = instanceContextText(read);
            const payload = read.kind === 'context'
                ? { context: text }
                : { empty: true, nothingExposed: read.kind === 'withheld' };
            telemetryPayload.results = {
                success: true,
                data: { empty: read.kind !== 'context', outcome: read.kind },
            };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            return { content: [{ type: 'text', text }], structuredContent: payload };
        }
        catch (error) {
            telemetryPayload.results = {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            throw error;
        }
    },
});
exports.createGetInstanceContextTool = createGetInstanceContextTool;
exports.INSTANCE_CONTEXT_RESOURCE_DESCRIPTION = 'What exists on this n8n instance, what changed recently, and what has run. Read this at the ' +
    'start of a session to pick up work already in progress.';
//# sourceMappingURL=get-instance-context.tool.js.map