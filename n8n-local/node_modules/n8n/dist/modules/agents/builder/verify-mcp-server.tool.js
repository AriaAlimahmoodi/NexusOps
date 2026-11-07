"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildVerifyMcpServerTool = buildVerifyMcpServerTool;
const tool_1 = require("@n8n/agents/tool");
const agent_config_1 = require("@n8n/ai-utilities/agent-config");
const api_types_1 = require("@n8n/api-types");
const zod_1 = require("zod");
const builder_tool_names_1 = require("./builder-tool-names");
const mcp_client_factory_1 = require("../json-config/mcp-client-factory");
const DEFAULT_MCP_VERIFICATION_TIMEOUT_MS = 10_000;
async function listToolsWithinDeadline(client, timeoutMs, abortSignal) {
    if (abortSignal?.aborted) {
        throw new Error('MCP server verification was cancelled');
    }
    let timeoutId;
    let onAbort;
    const control = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new Error(`MCP server verification timed out after ${timeoutMs}ms`));
        }, timeoutMs);
        if (abortSignal) {
            onAbort = () => reject(new Error('MCP server verification was cancelled'));
            abortSignal.addEventListener('abort', onAbort, { once: true });
        }
    });
    try {
        return await Promise.race([client.listTools(), control]);
    }
    finally {
        if (timeoutId !== undefined)
            clearTimeout(timeoutId);
        if (onAbort)
            abortSignal?.removeEventListener('abort', onAbort);
    }
}
const verifyMcpServerInputSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(1)
        .max(64)
        .refine((name) => name.trim().length > 0, 'MCP server name cannot be blank')
        .describe('The user-facing server name; it is normalized for model-facing tool names'),
    url: zod_1.z.string().min(1).describe('The MCP server endpoint URL'),
    transport: zod_1.z
        .enum(['sse', 'streamableHttp'])
        .default('streamableHttp')
        .describe('Transport type. Defaults to streamableHttp'),
    authentication: zod_1.z
        .union([api_types_1.McpAuthenticationSchemaTypes, api_types_1.McpOAuth2CredentialTypeSchema])
        .default('none')
        .describe('Authentication scheme'),
    credential: zod_1.z
        .string()
        .optional()
        .describe('Credential id returned by agent_builder_ask_credential. Required when authentication is not "none"'),
    metadata: zod_1.z.object({ nodeTypeName: zod_1.z.string().optional() }).optional(),
    connectionTimeoutMs: zod_1.z
        .number()
        .int()
        .min(1)
        .max(120_000)
        .optional()
        .describe('Timeout in milliseconds for the whole verification (connect + list tools). Defaults to 10000ms'),
});
function buildVerifyMcpServerTool(deps) {
    return new tool_1.Tool(builder_tool_names_1.BUILDER_TOOLS.VERIFY_MCP_SERVER)
        .legacyNames(...(0, api_types_1.getLegacyBuilderToolNames)(builder_tool_names_1.BUILDER_TOOLS.VERIFY_MCP_SERVER))
        .description('Test connectivity to an MCP server before adding it to the agent config. ' +
        'Establishes a temporary connection, lists the available tools, then closes the connection. ' +
        'Returns { ok: true, tools: [{ name, description, category }] } on success, or ' +
        '{ ok: false, error: string } on failure. ' +
        'Tool names are the original MCP names without the model-facing server prefix. ' +
        'When a credential is provided and a matching mcpServers entry already exists, ' +
        'a successful verify also writes the credential into that entry ' +
        '({ credentialApplied: true, configMutated: true, agentId, config, configHash }) — no ' +
        'agent-context/agent_builder_patch_config follow-up. Treat the returned config as the current state and use ' +
        'its configHash as baseConfigHash for your next config write. ' +
        'Call this after agent_builder_ask_credential when authentication is not "none".')
        .input(verifyMcpServerInputSchema)
        .handler(async (input, ctx) => {
        const timeoutMs = input.connectionTimeoutMs ?? DEFAULT_MCP_VERIFICATION_TIMEOUT_MS;
        let client;
        try {
            client = await (0, mcp_client_factory_1.buildMcpClientForServer)({
                name: input.name,
                url: input.url,
                transport: input.transport,
                authentication: input.authentication,
                credential: input.credential,
                metadata: input.metadata,
                toolPermissions: {
                    categories: { read: 'always_allow', write: 'always_allow' },
                },
                connectionTimeoutMs: timeoutMs,
            }, deps);
            const tools = await listToolsWithinDeadline(client, timeoutMs, ctx.abortSignal);
            const failures = client.getConnectionFailures();
            if (failures.length > 0) {
                return {
                    ok: false,
                    error: failures
                        .map((failure) => `MCP server "${failure.server}" connection failed: ${failure.error}`)
                        .join('; '),
                };
            }
            const mappedTools = tools.map((t) => ({
                name: t.mcpToolName ?? t.name,
                description: t.description ?? '',
                category: (0, agent_config_1.classifyMcpTool)({
                    name: t.mcpToolName ?? t.name,
                    annotations: t.mcpAnnotations,
                }),
            }));
            if (input.credential && deps.applyCredentialToMcpServer) {
                try {
                    const applyResult = await deps.applyCredentialToMcpServer(input.name, input.credential);
                    if (applyResult.applied && deps.agentId) {
                        return {
                            ok: true,
                            tools: mappedTools,
                            credentialApplied: true,
                            configMutated: true,
                            agentId: deps.agentId,
                            config: applyResult.config,
                            configHash: applyResult.configHash,
                        };
                    }
                }
                catch {
                    return {
                        ok: true,
                        tools: mappedTools,
                        credentialApplied: false,
                    };
                }
            }
            return {
                ok: true,
                tools: mappedTools,
            };
        }
        catch (error) {
            return {
                ok: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
        finally {
            await client?.close().catch(() => { });
        }
    })
        .build();
}
//# sourceMappingURL=verify-mcp-server.tool.js.map