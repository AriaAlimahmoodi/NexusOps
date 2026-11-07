"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGetWorkflowSdkReferenceTool = void 0;
const zod_1 = __importDefault(require("zod"));
const constants_1 = require("./constants");
const sdk_reference_content_1 = require("./sdk-reference-content");
const mcp_constants_1 = require("../../mcp.constants");
const VALID_SECTIONS = [
    'patterns',
    'patterns_detailed',
    'expressions',
    'functions',
    'rules',
    'import',
    'guidelines',
    'design',
    'groups',
    'all',
];
const inputSchema = {
    section: zod_1.default
        .enum(VALID_SECTIONS)
        .optional()
        .describe('Optional section to retrieve. Omit this for the full reference, or use a section for targeted lookup.'),
};
const outputSchema = {
    reference: zod_1.default.string().describe('SDK reference documentation content for the requested section'),
};
const createGetWorkflowSdkReferenceTool = (user, telemetry) => ({
    name: constants_1.MCP_GET_SDK_REFERENCE_TOOL.toolName,
    config: {
        description: 'Required reference when building a workflow, and only then. Call this BEFORE writing workflow code to learn workflow(), trigger()/node(), .add()/.to(), expr(), and credential patterns.',
        inputSchema,
        outputSchema,
        annotations: {
            title: constants_1.MCP_GET_SDK_REFERENCE_TOOL.displayTitle,
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    },
    handler: ({ section }) => {
        const telemetryPayload = {
            user_id: user.id,
            tool_name: constants_1.MCP_GET_SDK_REFERENCE_TOOL.toolName,
            parameters: { section },
        };
        const content = (0, sdk_reference_content_1.getSdkReferenceContent)(section);
        telemetryPayload.results = { success: true };
        telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
        return {
            content: [{ type: 'text', text: content }],
            structuredContent: { reference: content },
        };
    },
});
exports.createGetWorkflowSdkReferenceTool = createGetWorkflowSdkReferenceTool;
//# sourceMappingURL=get-workflow-sdk-reference.tool.js.map