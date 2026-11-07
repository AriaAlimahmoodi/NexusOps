"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpConnectionDiscoveryService = void 0;
const agents_1 = require("@n8n/agents");
const agent_config_1 = require("@n8n/ai-utilities/agent-config");
const backend_common_1 = require("@n8n/backend-common");
const backend_network_1 = require("@n8n/backend-network");
const backend_services_1 = require("@n8n/backend-services");
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const credential_types_1 = require("../../credential-types");
const credentials_helper_1 = require("../../credentials-helper");
const oauth_service_1 = require("../../oauth/oauth.service");
const ai_proxy_fetch_1 = require("../../utils/ai-proxy-fetch");
const mcp_auth_fetch_1 = require("./mcp-auth-fetch");
const mcp_registry_connection_1 = require("./mcp-registry-connection");
const mcp_registry_service_1 = require("./registry/mcp-registry.service");
const discoveryTimeoutMs = 10_000;
function disconnected(failureReason) {
    return { status: 'disconnected', failureReason, tools: [] };
}
function stripServerPrefix(toolName, serverName) {
    const prefix = `${serverName}_`;
    return toolName.startsWith(prefix) ? toolName.slice(prefix.length) : toolName;
}
function safeServerName(name) {
    const normalized = name.replace(/[^A-Za-z0-9_-]/g, '_');
    return (normalized || 'mcp_server').slice(0, 64);
}
function toTool(tool, serverName) {
    const name = tool.mcpToolName ?? stripServerPrefix(tool.name, serverName);
    return {
        name,
        ...(tool.description ? { description: tool.description } : {}),
        category: (0, agent_config_1.classifyMcpTool)({ name, annotations: tool.mcpAnnotations }),
    };
}
function classifyResponseFailure(response, current) {
    if (response.status === 401 || response.status === 403)
        return 'authentication';
    if (response.status >= 500)
        return 'server_unavailable';
    return current;
}
async function listToolsWithinDeadline(client, timeoutMs) {
    let timeoutId;
    const timeout = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`MCP discovery timed out after ${timeoutMs}ms`)), timeoutMs);
    });
    try {
        return await Promise.race([client.listTools(), timeout]);
    }
    finally {
        if (timeoutId !== undefined)
            clearTimeout(timeoutId);
    }
}
let McpConnectionDiscoveryService = class McpConnectionDiscoveryService {
    constructor(logger, registryService, credentialsFinderService, credentialsHelper, credentialTypes, oauthService, outboundHttp) {
        this.registryService = registryService;
        this.credentialsFinderService = credentialsFinderService;
        this.credentialsHelper = credentialsHelper;
        this.credentialTypes = credentialTypes;
        this.oauthService = oauthService;
        this.outboundHttp = outboundHttp;
        this.logger = logger.scoped('mcp-registry');
    }
    async discover(user, request) {
        let prepared;
        try {
            prepared = await this.prepareRegistrySource(user, request);
        }
        catch (error) {
            if (error instanceof errors_1.NotFoundError)
                throw error;
            this.logger.warn('Failed to prepare MCP discovery', {
                errorType: (0, ensure_error_1.ensureError)(error).name,
            });
            return disconnected('authentication');
        }
        let failureReason = 'unknown';
        let receivedResponse = false;
        const classifiedFetch = async (input, init) => {
            try {
                const response = await prepared.clientConfig.fetch(input, init);
                receivedResponse = true;
                failureReason = classifyResponseFailure(response, failureReason);
                return response;
            }
            catch (error) {
                failureReason = 'server_unavailable';
                throw error;
            }
        };
        const client = new agents_1.McpClient([
            {
                ...prepared.clientConfig,
                fetch: classifiedFetch,
                connectionTimeoutMs: discoveryTimeoutMs,
            },
        ]);
        try {
            const tools = (await listToolsWithinDeadline(client, discoveryTimeoutMs)).map((tool) => toTool(tool, prepared.clientConfig.name));
            if (client.getConnectionFailures().length > 0)
                return disconnected(failureReason);
            return {
                status: 'connected',
                connection: prepared.responseConnection,
                tools,
            };
        }
        catch (error) {
            if (failureReason === 'unknown' && !receivedResponse)
                failureReason = 'server_unavailable';
            this.logger.warn('MCP discovery connection failed', {
                errorType: (0, ensure_error_1.ensureError)(error).name,
            });
            return disconnected(failureReason);
        }
        finally {
            await client.close().catch((error) => {
                this.logger.warn('Failed to close MCP discovery client', {
                    errorType: (0, ensure_error_1.ensureError)(error).name,
                });
            });
        }
    }
    async prepareRegistrySource(user, source) {
        const server = await this.registryService.get(source.slug);
        if (server?.status !== 'active') {
            throw new errors_1.NotFoundError('MCP registry server not found');
        }
        const connection = (0, mcp_registry_connection_1.resolveMcpRegistryConnection)(server);
        if (!connection)
            throw new errors_1.BadRequestError('MCP registry server has no supported connection');
        const resolvedCredential = await this.resolveCredential(user, source.credentialId);
        const { credential, data } = resolvedCredential;
        if (!(0, mcp_registry_connection_1.isSupportedMcpRegistryCredentialType)(this.credentialTypes, credential.type) ||
            !connection.credentialBindings.some((binding) => binding.credentialType === credential.type)) {
            throw new errors_1.BadRequestError('Credential type is not supported by this MCP server');
        }
        const prepared = (0, mcp_registry_connection_1.prepareMcpRegistryConnection)({
            connection,
            credentialType: credential.type,
            credentialData: data,
        });
        if (!prepared.ok)
            throw new errors_1.BadRequestError('Credential cannot connect to this MCP server');
        return {
            clientConfig: {
                name: safeServerName(source.slug),
                url: prepared.value.endpointUrl,
                transport: (0, mcp_registry_connection_1.toAgentMcpTransport)(prepared.value.transport),
                fetch: this.createCredentialFetch(resolvedCredential, prepared.value.headers, {
                    mode: 'domains',
                    domains: prepared.value.allowedDomains,
                }),
            },
            responseConnection: {
                url: (0, mcp_registry_connection_1.getConfiguredEndpointUrl)(connection),
                transport: (0, mcp_registry_connection_1.toAgentMcpTransport)(connection.transport),
                authentication: credential.type,
                credentialId: credential.id,
                metadata: { nodeTypeName: connection.nodeTypeName },
            },
        };
    }
    async resolveCredential(user, credentialId) {
        const readableCredential = await this.credentialsFinderService.findCredentialForUser(credentialId, user, ['credential:read']);
        if (!readableCredential) {
            throw new errors_1.NotFoundError('Credential not found or not accessible');
        }
        if (readableCredential.isResolvable) {
            const connectableCredential = await this.credentialsFinderService.findCredentialForUser(credentialId, user, ['credential:connect']);
            if (!connectableCredential) {
                throw new errors_1.NotFoundError('Credential not found or not accessible');
            }
        }
        const projectId = readableCredential.shared?.find((share) => share.role === 'credential:owner')?.projectId ??
            readableCredential.shared?.[0]?.projectId;
        if (!projectId)
            throw new errors_1.BadRequestError('Credential has no owning project');
        const { getBase } = await import('../../workflow-execute-additional-data.js');
        const additionalData = await getBase({ projectId, userId: user.id });
        const data = await this.credentialsHelper.getDecrypted(additionalData, { id: readableCredential.id, name: readableCredential.name }, readableCredential.type, 'internal');
        if (!(0, backend_common_1.isObjectLiteral)(data) || Object.keys(data).length === 0) {
            throw new errors_1.BadRequestError('Credential could not be resolved');
        }
        return { credential: readableCredential, data, projectId };
    }
    createCredentialFetch(resolved, initialHeaders, allowedDomains) {
        return (0, mcp_auth_fetch_1.createMcpAuthFetch)({
            authentication: resolved.credential.type,
            baseFetch: (0, ai_proxy_fetch_1.createAiMcpFetch)(this.outboundHttp),
            credentialData: resolved.data,
            credentialId: resolved.credential.id,
            initialHeaders,
            oauthService: this.oauthService,
            projectId: resolved.projectId,
            allowedDomains,
        });
    }
};
exports.McpConnectionDiscoveryService = McpConnectionDiscoveryService;
exports.McpConnectionDiscoveryService = McpConnectionDiscoveryService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, mcp_registry_service_1.McpRegistryService, backend_services_1.CredentialsFinderService, credentials_helper_1.CredentialsHelper, credential_types_1.CredentialTypes, oauth_service_1.OauthService, backend_network_1.OutboundHttp])
], McpConnectionDiscoveryService);
//# sourceMappingURL=mcp-connection-discovery.service.js.map