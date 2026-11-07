"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMcpClientForServer = buildMcpClientForServer;
exports.listMcpServerTools = listMcpServerTools;
const agent_config_1 = require("@n8n/ai-utilities/agent-config");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const n8n_workflow_1 = require("n8n-workflow");
const mcp_registry_connection_1 = require("../../../modules/mcp-registry/mcp-registry-connection");
const mcp_auth_fetch_1 = require("../../../modules/mcp-registry/mcp-auth-fetch");
async function deriveAuthHeaders(server, credentialProvider) {
    if (server.authentication === 'none' || !server.credential)
        return { headers: {} };
    try {
        const [resolved, credentials] = await Promise.all([
            credentialProvider.resolve(server.credential),
            credentialProvider.list(),
        ]);
        const credential = credentials?.find((candidate) => candidate.id === server.credential);
        if (credentials !== undefined && !credential) {
            throw new n8n_workflow_1.OperationalError('Credential not found or not accessible');
        }
        const credentialData = resolved;
        return {
            headers: (0, n8n_workflow_1.getMcpAuthHeaders)(server.authentication, credentialData),
            credentialData,
            credentialType: credential?.type ?? server.authentication,
        };
    }
    catch (error) {
        return { headers: {}, credentialError: (0, ensure_error_1.ensureError)(error) };
    }
}
const UNRESOLVED_CREDENTIAL_URL = 'https://credential-unresolved.invalid/';
async function buildMcpClientForServer(server, deps) {
    const { credentialProvider, oauthService, projectId, proxyFetch, onConnectionFailed, onToolCallSettled, nonInterrupting, } = deps;
    const { toolPermissions } = server;
    const { McpClient } = await import('@n8n/agents');
    const derivedAuth = await deriveAuthHeaders(server, credentialProvider);
    const { credentialData, credentialType } = derivedAuth;
    let { headers: initialHeaders, credentialError } = derivedAuth;
    let runtimeUrl = server.url;
    let runtimeTransport = server.transport;
    const mcpHostname = URL.canParse(server.url) ? new URL(server.url).hostname : undefined;
    let allowedDomains = credentialData
        ? (0, mcp_auth_fetch_1.resolveMcpAuthDomainPolicy)(server.authentication, credentialData, mcpHostname)
        : undefined;
    const registryNodeName = server.metadata?.nodeTypeName;
    if (!registryNodeName && credentialType?.endsWith('McpOAuth2Api')) {
        credentialError = new n8n_workflow_1.OperationalError(`Credential type "${credentialType}" requires an MCP registry node`);
    }
    else if (registryNodeName) {
        try {
            const connection = await deps.resolveRegistryConnection?.(registryNodeName);
            if (!connection ||
                !credentialData ||
                !credentialType ||
                !(0, n8n_workflow_1.isMcpOAuth2Authentication)(credentialType)) {
                throw new n8n_workflow_1.OperationalError('MCP registry connection could not be resolved');
            }
            const prepared = (0, mcp_registry_connection_1.prepareMcpRegistryConnection)({
                connection,
                credentialType,
                credentialData,
            });
            if (!prepared.ok)
                throw new n8n_workflow_1.OperationalError(prepared.error.message);
            initialHeaders = prepared.value.headers;
            runtimeUrl = prepared.value.endpointUrl;
            runtimeTransport = (0, mcp_registry_connection_1.toAgentMcpTransport)(prepared.value.transport);
            allowedDomains = { mode: 'domains', domains: prepared.value.allowedDomains };
        }
        catch (error) {
            credentialError = (0, ensure_error_1.ensureError)(error);
        }
    }
    const { url, fetch: authFetch } = credentialError
        ? {
            url: UNRESOLVED_CREDENTIAL_URL,
            fetch: (async () => await Promise.reject(new n8n_workflow_1.OperationalError(`Could not resolve the credential for MCP server "${server.name}": ${credentialError.message}`))),
        }
        : {
            url: runtimeUrl,
            fetch: (0, mcp_auth_fetch_1.createMcpAuthFetch)({
                authentication: server.authentication,
                baseFetch: proxyFetch,
                credentialData: credentialData ?? {},
                credentialId: server.credential,
                initialHeaders,
                oauthService,
                projectId,
                allowedDomains,
            }),
        };
    const sdkServerConfig = {
        name: server.name,
        url,
        transport: runtimeTransport,
        fetch: authFetch,
        ...(toolPermissions !== undefined && {
            configureTools: (tools) => (0, agent_config_1.compileMcpToolPermissions)(toolPermissions, tools),
        }),
        ...(nonInterrupting && { configureToolsNonInterrupting: true }),
        ...(onToolCallSettled !== undefined && { onToolCallSettled }),
        ...(server.connectionTimeoutMs !== undefined && {
            connectionTimeoutMs: server.connectionTimeoutMs,
        }),
        ...(onConnectionFailed
            ? {
                onConnectionFailed: (event) => onConnectionFailed(event),
            }
            : {}),
    };
    return new McpClient([sdkServerConfig]);
}
async function listMcpServerTools(server, deps) {
    let client;
    try {
        client = await buildMcpClientForServer(server, deps);
        const tools = await client.listTools();
        const failures = client.getConnectionFailures();
        if (failures.length > 0) {
            throw new n8n_workflow_1.OperationalError(failures
                .map((failure) => `MCP server "${failure.server}" connection failed: ${failure.error}`)
                .join('; '));
        }
        return tools.map((tool) => ({ name: tool.name, description: tool.description ?? '' }));
    }
    finally {
        await client?.close().catch(() => { });
    }
}
//# sourceMappingURL=mcp-client-factory.js.map