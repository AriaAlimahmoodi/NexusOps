"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMcpMockFetch = createMcpMockFetch;
const n8n_workflow_1 = require("n8n-workflow");
const date_anchors_1 = require("./date-anchors");
const mock_utils_1 = require("./mock-utils");
const MAX_PRIOR_CALL_CONTEXT_CHARS = 2_000;
const MOCK_SESSION_ID = 'eval-mock-session';
const TOOLS_LIST_PROMPT = `You design the tool catalog a mocked MCP server exposes during an automated eval run. An AI agent (whose instructions you are given) will connect to this server and call its tools; an API mock will answer those calls later.

RULES:
1. Expose 1-4 tools — exactly the capabilities the agent's instructions expect from THIS server, nothing speculative.
2. Tool names: short snake_case, WITHOUT any server-name prefix (the client adds it).
3. Each tool needs a one-sentence description and an "inputSchema": a JSON Schema object with "type": "object", simple "properties" (string/number/boolean), and a "required" array. Keep schemas minimal — 1-3 properties.
4. If a "Server data hint" or "Test Scenario" is provided, the catalog must make that scenario playable (e.g. a lookup scenario needs a lookup tool).
5. **When a "## Canonical tools" section is provided, the catalog is FIXED**: return exactly those tool names with those descriptions, in that order — your job is ONLY to design each tool's inputSchema.
6. Return ONLY valid JSON: { "tools": [ { "name", "description", "inputSchema" } ] }`;
const TOOL_CALL_PROMPT = `You simulate ONE tool invocation on a mocked MCP server during an automated eval run. Given the tool, its arguments, and the scenario context, produce the exact result the real server would return.

RULES:
1. **The Test Scenario and Server data hint are authoritative.** Honor their exact names, values, counts, and error conditions. When they mandate an error for this request, return { "isError": true, "text": "<the error>" }.
2. Return realistic, concrete content — the actual data a real server would produce, not a description of it. Small result sets (1-3 items) unless the scenario demands otherwise.
3. Stay consistent with the Global context and with the PRIOR CALLS listed (same entities, ids, and dates across calls).
4. Every date you emit derives from the "## Date anchors" block, never from training data.
5. Return ONLY valid JSON: { "text": "<the tool result as the server would render it>" } or { "isError": true, "text": "<error message>" }.`;
function validateToolsList(parsed) {
    if (parsed === null || typeof parsed !== 'object')
        return undefined;
    const tools = parsed.tools;
    if (!Array.isArray(tools) || tools.length === 0)
        return undefined;
    const valid = [];
    for (const entry of tools) {
        if (entry === null || typeof entry !== 'object')
            continue;
        const tool = entry;
        if (typeof tool.name !== 'string' || tool.name.length === 0)
            continue;
        const generatedSchema = tool.inputSchema !== null &&
            typeof tool.inputSchema === 'object' &&
            tool.inputSchema.type === 'object'
            ? tool.inputSchema
            : { type: 'object', properties: {} };
        valid.push({
            name: tool.name,
            description: typeof tool.description === 'string' ? tool.description : tool.name,
            inputSchema: generatedSchema,
        });
    }
    return valid.length > 0 ? valid : undefined;
}
function validateToolResult(parsed) {
    if (parsed === null || typeof parsed !== 'object')
        return undefined;
    const record = parsed;
    if (typeof record.text !== 'string' || record.text.length === 0)
        return undefined;
    return { text: record.text, isError: record.isError === true };
}
function jsonRpcResponse(id, result, headers) {
    return new Response(JSON.stringify({ jsonrpc: '2.0', id, result }), {
        status: 200,
        headers: { 'content-type': 'application/json', ...headers },
    });
}
function jsonRpcError(id, code, message) {
    return new Response(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
    });
}
function createMcpMockFetch(options) {
    const { logger } = options;
    const toolsByServer = new Map();
    const resultCache = new Map();
    const priorCallsByServer = new Map();
    function resolveServer(url) {
        const match = options.servers.find((server) => url === server.url || url.startsWith(`${server.url.replace(/\/+$/, '')}/`));
        if (match)
            return match;
        try {
            return { name: new URL(url).hostname, url };
        }
        catch {
            return { name: 'unknown-mcp-server', url };
        }
    }
    function scenarioSections(server) {
        const sections = [];
        const hint = options.serverHints?.[server.name];
        if (hint)
            sections.push('', '## Server data hint', '', hint);
        if (options.globalContext)
            sections.push('', '## Global context', '', options.globalContext);
        if (options.scenarioHints)
            sections.push('', '## Test Scenario', '', options.scenarioHints);
        return sections;
    }
    function coerceToCanonical(generated, canonical) {
        const schemasByName = new Map((generated ?? []).map((tool) => [tool.name, tool.inputSchema]));
        return canonical.map((tool) => ({
            name: tool.name,
            description: tool.description,
            inputSchema: schemasByName.get(tool.name) ?? { type: 'object', properties: {} },
        }));
    }
    async function getTools(server) {
        let cached = toolsByServer.get(server.name);
        if (!cached) {
            cached = (async () => {
                const canonical = options.knownToolsByServer?.[server.name];
                const sections = [
                    `Design the tool catalog for the MCP server "${server.name}"${server.description ? ` (${server.description})` : ''} at ${server.url}.`,
                    '',
                    '## Agent instructions (what the agent expects from this server)',
                    '',
                    options.agentInstructions.slice(0, 3_000),
                    ...(canonical && canonical.length > 0
                        ? [
                            '',
                            '## Canonical tools (the catalog is FIXED to exactly these)',
                            '',
                            ...canonical.map((tool) => `- ${tool.name}: ${tool.description}`),
                        ]
                        : []),
                    ...scenarioSections(server),
                ];
                const tools = await (0, mock_utils_1.generateJson)('eval-mcp-tools-list', TOOLS_LIST_PROMPT, sections.join('\n'), validateToolsList, logger);
                if (canonical && canonical.length > 0) {
                    const coerced = coerceToCanonical(tools, canonical);
                    logger.debug(`[EvalMcpMock] ${server.name} exposes canonical catalog: ${coerced.map((tool) => tool.name).join(', ')}`);
                    return coerced;
                }
                if (tools) {
                    logger.debug(`[EvalMcpMock] ${server.name} exposes: ${tools.map((tool) => tool.name).join(', ')}`);
                    return tools;
                }
                logger.warn(`[EvalMcpMock] Tool catalog generation failed for ${server.name} — using a generic fallback tool`);
                return [
                    {
                        name: 'query',
                        description: `Query the ${server.name} server`,
                        inputSchema: {
                            type: 'object',
                            properties: { query: { type: 'string', description: 'The query' } },
                            required: ['query'],
                        },
                    },
                ];
            })();
            toolsByServer.set(server.name, cached);
        }
        return await cached;
    }
    async function callTool(server, toolName, args) {
        const cacheKey = `${server.name}:${toolName}:${JSON.stringify(args ?? {})}`;
        let cached = resultCache.get(cacheKey);
        if (!cached) {
            cached = (async () => {
                const tools = await getTools(server);
                const tool = tools.find((entry) => entry.name === toolName);
                const prior = priorCallsByServer.get(server.name) ?? [];
                const sections = [
                    `Simulate the MCP tool "${toolName}" on server "${server.name}".`,
                    '',
                    '## Tool',
                    '',
                    JSON.stringify(tool ?? { name: toolName }, null, 1),
                    '',
                    '## Arguments',
                    '',
                    JSON.stringify(args ?? {}, null, 1),
                    ...scenarioSections(server),
                    ...(prior.length > 0
                        ? ['', '## Prior calls this run (stay consistent with these)', '', ...prior]
                        : []),
                    '',
                    '## Date anchors',
                    (0, date_anchors_1.buildDateAnchors)(new Date()),
                ];
                const generated = await (0, mock_utils_1.generateJson)('eval-mcp-tool-call', TOOL_CALL_PROMPT, sections.join('\n'), validateToolResult, logger);
                return (generated ?? {
                    text: `Mock generation failed for MCP tool "${toolName}" — treat this scenario failure as a framework issue, not agent behaviour.`,
                    isError: true,
                });
            })();
            resultCache.set(cacheKey, cached);
        }
        const result = await cached;
        const priorEntries = priorCallsByServer.get(server.name) ?? [];
        const entry = `- ${toolName}(${JSON.stringify(args ?? {}).slice(0, 300)}) -> ${result.text.slice(0, 300)}`;
        if (!priorEntries.includes(entry) &&
            priorEntries.join('\n').length < MAX_PRIOR_CALL_CONTEXT_CHARS) {
            priorEntries.push(entry);
            priorCallsByServer.set(server.name, priorEntries);
        }
        return result;
    }
    return async (input, init) => {
        const url = (0, mock_utils_1.resolveUrl)(input);
        const method = (init?.method ?? 'GET').toUpperCase();
        const server = resolveServer(url);
        if (method === 'GET')
            return new Response(null, { status: 405 });
        if (method === 'DELETE')
            return new Response(null, { status: 200 });
        if (method !== 'POST')
            return new Response(null, { status: 405 });
        const rawBody = typeof init?.body === 'string' ? init.body : '';
        const message = (0, n8n_workflow_1.jsonParse)(rawBody, { fallbackValue: null });
        if (message === null || typeof message !== 'object') {
            return jsonRpcError(null, -32700, 'Parse error');
        }
        const { id, method: rpcMethod, params } = message;
        if (id === undefined || id === null)
            return new Response(null, { status: 202 });
        try {
            switch (rpcMethod) {
                case 'initialize': {
                    const requested = params !== null &&
                        typeof params === 'object' &&
                        typeof params.protocolVersion === 'string'
                        ? params.protocolVersion
                        : '2025-06-18';
                    return jsonRpcResponse(id, {
                        protocolVersion: requested,
                        capabilities: { tools: { listChanged: false } },
                        serverInfo: { name: server.name, version: '1.0.0-eval-mock' },
                    }, { 'mcp-session-id': MOCK_SESSION_ID });
                }
                case 'ping':
                    return jsonRpcResponse(id, {});
                case 'tools/list':
                    return jsonRpcResponse(id, { tools: await getTools(server) });
                case 'tools/call': {
                    const callParams = params !== null && typeof params === 'object'
                        ? params
                        : {};
                    const toolName = typeof callParams.name === 'string' ? callParams.name : 'unknown';
                    const args = callParams.arguments ?? {};
                    const result = await callTool(server, toolName, args);
                    options.onToolCall({ serverName: server.name, toolName, args, result });
                    return jsonRpcResponse(id, {
                        content: [{ type: 'text', text: result.text }],
                        ...(result.isError ? { isError: true } : {}),
                    });
                }
                case 'resources/list':
                    return jsonRpcResponse(id, { resources: [] });
                case 'resources/templates/list':
                    return jsonRpcResponse(id, { resourceTemplates: [] });
                case 'prompts/list':
                    return jsonRpcResponse(id, { prompts: [] });
                default:
                    return jsonRpcError(id, -32601, `Method not found: ${String(rpcMethod)}`);
            }
        }
        catch (error) {
            const messageText = error instanceof Error ? error.message : String(error);
            logger.warn(`[EvalMcpMock] ${server.name} ${String(rpcMethod)} failed: ${messageText}`);
            return jsonRpcError(id, -32603, messageText);
        }
    };
}
//# sourceMappingURL=mcp-mock-fetch.js.map