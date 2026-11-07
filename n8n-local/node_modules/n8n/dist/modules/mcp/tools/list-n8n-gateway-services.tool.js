"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createListN8nGatewayServicesTool = void 0;
const zod_1 = __importDefault(require("zod"));
const mcp_constants_1 = require("../mcp.constants");
const inputSchema = {};
const outputSchema = {
    available: zod_1.default
        .boolean()
        .describe('True when Gateway credits are available for this instance. When false, the remaining fields are omitted.'),
    credentialTypes: zod_1.default
        .array(zod_1.default.string())
        .optional()
        .describe('Credential type names Gateway credits can provide (e.g. "openAiApi").'),
    nodes: zod_1.default
        .array(zod_1.default.string())
        .optional()
        .describe('Node types Gateway credits cover (e.g. "@n8n/n8n-nodes-langchain.openAi").'),
    supportedActions: zod_1.default
        .record(zod_1.default.record(zod_1.default.array(zod_1.default.string())))
        .optional()
        .describe('Per-node allowlist keyed by node type, then resource (or `__operation_only__` for nodes without a resource dimension). Values are supported operation names.'),
    minNodeTypeVersion: zod_1.default
        .record(zod_1.default.number())
        .optional()
        .describe('Minimum `typeVersion` per node type for Gateway credits coverage.'),
    hiddenNodeProperties: zod_1.default
        .record(zod_1.default.array(zod_1.default.string()))
        .optional()
        .describe('Per-node property names hidden from the user when Gateway credits provide the credential.'),
};
const createListN8nGatewayServicesTool = (user, aiGatewayService, telemetry) => ({
    name: mcp_constants_1.LIST_N8N_GATEWAY_SERVICES_TOOL_NAME,
    config: {
        description: 'List Gateway credits coverage: node and credential types the platform can provide managed credentials for, plus supported resource+operation combinations, minimum type versions, and hidden node properties. Use this to decide which nodes let the user skip credential setup.',
        inputSchema,
        outputSchema,
        annotations: {
            title: 'List services available with Gateway credits',
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    },
    handler: async () => {
        const telemetryPayload = {
            user_id: user.id,
            tool_name: mcp_constants_1.LIST_N8N_GATEWAY_SERVICES_TOOL_NAME,
        };
        const availability = await aiGatewayService.isAvailable();
        if (!availability.available) {
            const payload = { available: false };
            telemetryPayload.results = { success: true, data: { available: false } };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            return {
                content: [{ type: 'text', text: JSON.stringify(payload) }],
                structuredContent: payload,
            };
        }
        const { config } = availability;
        const payload = {
            available: true,
            credentialTypes: config.credentialTypes,
            nodes: config.nodes,
            ...(config.supportedActions ? { supportedActions: config.supportedActions } : {}),
            ...(config.minNodeTypeVersion ? { minNodeTypeVersion: config.minNodeTypeVersion } : {}),
            ...(config.hiddenNodeProperties ? { hiddenNodeProperties: config.hiddenNodeProperties } : {}),
        };
        telemetryPayload.results = { success: true, data: { available: true } };
        telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
        return {
            content: [{ type: 'text', text: JSON.stringify(payload) }],
            structuredContent: payload,
        };
    },
});
exports.createListN8nGatewayServicesTool = createListN8nGatewayServicesTool;
//# sourceMappingURL=list-n8n-gateway-services.tool.js.map