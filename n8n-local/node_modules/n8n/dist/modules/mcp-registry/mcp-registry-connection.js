"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCP_BASE_OAUTH2_CREDENTIAL_NAME = exports.MCP_REGISTRY_BASE_NODE_NAME = exports.LANGCHAIN_PACKAGE_NAME = exports.MCP_REGISTRY_PACKAGE_NAME = exports.getConfiguredEndpointUrl = void 0;
exports.getMcpRegistryCredentialTypeName = getMcpRegistryCredentialTypeName;
exports.getMcpRegistryCredentialOptions = getMcpRegistryCredentialOptions;
exports.isSupportedMcpRegistryCredentialType = isSupportedMcpRegistryCredentialType;
exports.resolveMcpRegistryConnection = resolveMcpRegistryConnection;
exports.prepareMcpRegistryConnection = prepareMcpRegistryConnection;
exports.toAgentMcpTransport = toAgentMcpTransport;
const change_case_1 = require("change-case");
const n8n_workflow_1 = require("n8n-workflow");
Object.defineProperty(exports, "getConfiguredEndpointUrl", { enumerable: true, get: function () { return n8n_workflow_1.getConfiguredEndpointUrl; } });
exports.MCP_REGISTRY_PACKAGE_NAME = '@n8n/mcp-registry';
exports.LANGCHAIN_PACKAGE_NAME = '@n8n/n8n-nodes-langchain';
exports.MCP_REGISTRY_BASE_NODE_NAME = 'mcpRegistryClientTool';
exports.MCP_BASE_OAUTH2_CREDENTIAL_NAME = 'mcpOAuth2Api';
function getMcpRegistryCredentialTypeName(server) {
    return `${(0, change_case_1.camelCase)(server.slug)}McpOAuth2Api`;
}
function getMcpRegistryCredentialOptions(server) {
    if (server.authType === 'usesCredentials')
        return server.usesCredentials ?? [];
    return [
        {
            credentialType: getMcpRegistryCredentialTypeName(server),
            name: 'OAuth2',
            value: 'oAuth2',
        },
    ];
}
function isSupportedMcpRegistryCredentialType(credentialTypes, name) {
    if (!credentialTypes.recognizes(name) || !(0, n8n_workflow_1.isMcpOAuth2Authentication)(name))
        return false;
    try {
        const credentialType = credentialTypes.getByName(name);
        return (credentialType.authenticate === undefined &&
            credentialType.preAuthentication === undefined &&
            (name === 'oAuth2Api' || credentialTypes.getParentTypes(name).includes('oAuth2Api')));
    }
    catch {
        return false;
    }
}
function resolveMcpRegistryConnection(server) {
    const remote = server.remotes.find(({ type }) => type === 'streamable-http' || type === 'streamable-http-templated') ?? server.remotes.find(({ type }) => type === 'sse');
    if (!remote)
        return null;
    const nodeTypeName = `${exports.MCP_REGISTRY_PACKAGE_NAME}.${(0, change_case_1.camelCase)(server.slug)}`;
    const credentialBindings = getMcpRegistryCredentialOptions(server).flatMap(({ credentialType, value }) => (0, n8n_workflow_1.isMcpOAuth2Authentication)(credentialType) ? [{ credentialType, selector: value }] : []);
    if (remote.type === 'streamable-http-templated') {
        return {
            nodeTypeName,
            credentialBindings,
            urlTemplate: remote.url,
            transport: 'httpStreamable',
            isTemplated: true,
            headers: remote.headers,
            attribution: server.attribution,
        };
    }
    try {
        const endpoint = new URL(remote.url);
        return {
            nodeTypeName,
            endpointUrl: endpoint.toString(),
            endpointHostname: endpoint.hostname,
            transport: remote.type === 'streamable-http' ? 'httpStreamable' : 'sse',
            credentialBindings,
            isTemplated: false,
            headers: remote.headers,
            attribution: server.attribution,
        };
    }
    catch {
        return null;
    }
}
function prepareMcpRegistryConnection({ connection, credentialType, credentialData, headers: preparedHeaders, }) {
    if (!connection.credentialBindings.some((binding) => binding.credentialType === credentialType)) {
        return {
            ok: false,
            error: {
                code: 'unsupported_credential',
                message: `Credential type "${credentialType}" is not supported by this MCP registry server`,
            },
        };
    }
    const headers = preparedHeaders ?? (0, n8n_workflow_1.getMcpAuthHeaders)(credentialType, credentialData);
    const authorization = new Headers(headers).get('authorization')?.trim();
    const [scheme, accessToken] = authorization?.split(/\s+/, 2) ?? [];
    if (scheme?.toLowerCase() !== 'bearer' || !accessToken) {
        return {
            ok: false,
            error: {
                code: 'missing_access_token',
                message: `Credential type "${credentialType}" does not contain an OAuth2 access token`,
            },
        };
    }
    const { nodeTypeName, transport } = connection;
    const mergedHeaders = { ...connection.headers, ...headers };
    if (connection.isTemplated) {
        const serverUrl = credentialData.serverUrl;
        const endpoint = typeof serverUrl === 'string' && serverUrl.length > 0 ? parseUrl(serverUrl) : undefined;
        if (!endpoint) {
            return {
                ok: false,
                error: {
                    code: 'unresolved_server_url',
                    message: `Credential type "${credentialType}" did not resolve a server URL`,
                },
            };
        }
        return {
            ok: true,
            value: {
                nodeTypeName,
                credentialType,
                transport,
                endpointUrl: endpoint.toString(),
                headers: mergedHeaders,
                allowedDomains: endpoint.hostname,
            },
        };
    }
    return {
        ok: true,
        value: {
            nodeTypeName,
            credentialType,
            transport,
            endpointUrl: connection.endpointUrl,
            headers: mergedHeaders,
            allowedDomains: connection.endpointHostname,
        },
    };
}
function parseUrl(value) {
    try {
        const url = new URL(value);
        return /^https?:$/.test(url.protocol) ? url : undefined;
    }
    catch {
        return undefined;
    }
}
function toAgentMcpTransport(transport) {
    return transport === 'httpStreamable' ? 'streamableHttp' : 'sse';
}
//# sourceMappingURL=mcp-registry-connection.js.map