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
exports.InstanceAiMcpRegistryService = void 0;
const agents_1 = require("@n8n/agents");
const agent_config_1 = require("@n8n/ai-utilities/agent-config");
const backend_common_1 = require("@n8n/backend-common");
const backend_network_1 = require("@n8n/backend-network");
const backend_services_1 = require("@n8n/backend-services");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const node_crypto_1 = require("node:crypto");
const credential_types_1 = require("../../../credential-types");
const credentials_service_1 = require("../../../credentials/credentials.service");
const errors_1 = require("@n8n/errors");
const mcp_auth_fetch_1 = require("../../../modules/mcp-registry/mcp-auth-fetch");
const mcp_registry_connection_1 = require("../../../modules/mcp-registry/mcp-registry-connection");
const mcp_registry_service_1 = require("../../../modules/mcp-registry/registry/mcp-registry.service");
const oauth_service_1 = require("../../../oauth/oauth.service");
const ai_proxy_fetch_1 = require("../../../utils/ai-proxy-fetch");
const instance_ai_settings_service_1 = require("../instance-ai-settings.service");
const instance_ai_mcp_registry_connection_repository_1 = require("../repositories/instance-ai-mcp-registry-connection.repository");
const MCP_REGISTRY_SERVER_PREFIX = 'mcp_';
const MAX_MCP_SERVER_NAME_LENGTH = 24;
function buildServerName(serverSlug, sequence) {
    const safeSlug = serverSlug.replace(/[^A-Za-z0-9_-]/g, '_');
    const baseName = `${MCP_REGISTRY_SERVER_PREFIX}${safeSlug}`;
    if (sequence <= 1) {
        return baseName.slice(0, MAX_MCP_SERVER_NAME_LENGTH);
    }
    const suffix = `_${sequence}`;
    const maxBaseLength = Math.max(0, MAX_MCP_SERVER_NAME_LENGTH - suffix.length);
    return `${baseName.slice(0, maxBaseLength)}${suffix}`;
}
function stripMcpServerPrefix(toolName, serverName) {
    const prefix = `${serverName}_`;
    return toolName.startsWith(prefix) ? toolName.slice(prefix.length) : toolName;
}
function toToolResponse(tool, serverName) {
    const name = tool.mcpToolName ?? stripMcpServerPrefix(tool.name, serverName);
    const response = {
        name,
        category: (0, agent_config_1.classifyMcpTool)({ name, annotations: tool.mcpAnnotations }),
    };
    if (tool.description)
        response.description = tool.description;
    return response;
}
function disconnectedToolsResponse(id, failureReason = 'unknown') {
    return { id, status: 'disconnected', tools: [], failureReason };
}
let InstanceAiMcpRegistryService = class InstanceAiMcpRegistryService {
    constructor(logger, connectionRepository, mcpRegistryService, credentialsFinderService, credentialsService, credentialTypes, oauthService, eventService, outboundHttp, instanceAiSettingsService) {
        this.connectionRepository = connectionRepository;
        this.mcpRegistryService = mcpRegistryService;
        this.credentialsFinderService = credentialsFinderService;
        this.credentialsService = credentialsService;
        this.credentialTypes = credentialTypes;
        this.oauthService = oauthService;
        this.eventService = eventService;
        this.outboundHttp = outboundHttp;
        this.instanceAiSettingsService = instanceAiSettingsService;
        this.logger = logger.scoped('instance-ai');
    }
    async listConnectionsForUser(user) {
        return await this.connectionRepository.findBy({ userId: user.id });
    }
    async createConnection(user, input) {
        const server = await this.mcpRegistryService.get(input.serverSlug);
        if (!server) {
            throw new errors_1.NotFoundError(`Unknown MCP registry server: ${input.serverSlug}`);
        }
        if ((0, mcp_registry_connection_1.resolveMcpRegistryConnection)(server)?.isTemplated) {
            throw new errors_1.BadRequestError(`MCP registry server "${input.serverSlug}" cannot be connected here`);
        }
        const existing = await this.connectionRepository.findOneBy({
            userId: user.id,
            serverSlug: input.serverSlug,
        });
        if (existing) {
            throw new errors_1.ConflictError('This MCP server is already connected. Disconnect first to use a different credential.');
        }
        const credential = await this.credentialsFinderService.findCredentialForUser(input.credentialId, user, ['credential:read']);
        if (!credential) {
            throw new errors_1.NotFoundError('Credential not found or not accessible');
        }
        this.assertCredentialAllowed(server, credential.type);
        const entity = this.connectionRepository.create({
            id: (0, node_crypto_1.randomUUID)(),
            userId: user.id,
            serverSlug: input.serverSlug,
            credentialId: input.credentialId,
            toolPermissions: input.toolPermissions ?? this.instanceAiSettingsService.getMcpToolPermissions(),
        });
        try {
            const connection = await this.connectionRepository.save(entity);
            this.eventService.emit('instance-ai-mcp-registry-connection-created', {
                userId: user.id,
                serverSlug: input.serverSlug,
            });
            return { connection, credential, server };
        }
        catch (error) {
            if ((0, db_1.isUniqueConstraintError)(error)) {
                throw new errors_1.ConflictError('A connection for this MCP server with this credential already exists');
            }
            throw error;
        }
    }
    async deleteConnection(user, id) {
        const connection = await this.connectionRepository.findOneBy({ id, userId: user.id });
        if (!connection) {
            throw new errors_1.NotFoundError('MCP registry connection not found');
        }
        await this.connectionRepository.delete({ id });
        this.eventService.emit('instance-ai-mcp-registry-connection-deleted', {
            userId: user.id,
            serverSlug: connection.serverSlug,
        });
    }
    async updateConnection(user, id, payload) {
        const connection = await this.connectionRepository.findOneBy({ id, userId: user.id });
        if (!connection) {
            throw new errors_1.NotFoundError('MCP registry connection not found');
        }
        if (payload.credentialId) {
            const server = await this.mcpRegistryService.get(connection.serverSlug);
            if (!server) {
                throw new errors_1.NotFoundError(`Unknown MCP registry server: ${connection.serverSlug}`);
            }
            await this.swapCredential(user, connection, payload.credentialId, server);
        }
        if (payload.toolPermissions)
            connection.toolPermissions = payload.toolPermissions;
        return await this.connectionRepository.save(connection);
    }
    async listConnectionTools(user, id) {
        const connection = await this.connectionRepository.findOneBy({ id, userId: user.id });
        if (!connection) {
            throw new errors_1.NotFoundError('MCP registry connection not found');
        }
        return await this.fetchConnectionTools(user, connection);
    }
    async listAllConnectionTools(user) {
        const connections = await this.connectionRepository.findBy({ userId: user.id });
        return await Promise.all(connections.map(async (connection) => {
            try {
                return await this.fetchConnectionTools(user, connection);
            }
            catch (error) {
                this.logger.warn('Failed to check MCP connection', {
                    connectionId: connection.id,
                    serverSlug: connection.serverSlug,
                    error,
                });
                return disconnectedToolsResponse(connection.id);
            }
        }));
    }
    async fetchConnectionTools(user, connection) {
        const server = await this.mcpRegistryService.get(connection.serverSlug);
        if (!server) {
            throw new errors_1.NotFoundError(`Unknown MCP registry server: ${connection.serverSlug}`);
        }
        const resolvedServer = this.resolveRegistryServer(connection.id, connection.serverSlug, connection.credentialId, server);
        if (!resolvedServer)
            return disconnectedToolsResponse(connection.id);
        const aiMcpFetch = (0, ai_proxy_fetch_1.createAiMcpFetch)(this.outboundHttp);
        const requestFetch = await this.buildRegistryServerFetch(resolvedServer, user, connection.id, aiMcpFetch);
        if (!requestFetch)
            return disconnectedToolsResponse(connection.id, 'authentication');
        let failureReason = 'unknown';
        const classifiedFetch = async (input, init) => {
            try {
                const response = await requestFetch(input, init);
                if (response.status === 401 || response.status === 403) {
                    failureReason = 'authentication';
                }
                else if (response.status >= 500) {
                    failureReason = 'server_unavailable';
                }
                return response;
            }
            catch (error) {
                failureReason = 'server_unavailable';
                throw error;
            }
        };
        const serverName = buildServerName(resolvedServer.serverSlug, 1);
        const client = new agents_1.McpClient([
            {
                name: serverName,
                url: resolvedServer.connection.endpointUrl,
                transport: (0, mcp_registry_connection_1.toAgentMcpTransport)(resolvedServer.connection.transport),
                fetch: classifiedFetch,
                connectionTimeoutMs: 10_000,
            },
        ]);
        try {
            const tools = (await client.listTools()).map((tool) => toToolResponse(tool, serverName));
            if (client.getConnectionFailures().length > 0) {
                return disconnectedToolsResponse(connection.id, failureReason);
            }
            return { id: connection.id, status: 'connected', tools };
        }
        finally {
            await client.close().catch((error) => {
                this.logger.warn('Failed to close MCP client after listing tools', {
                    connectionId: connection.id,
                    serverSlug: connection.serverSlug,
                    error,
                });
            });
        }
    }
    async getRegistryMcpServers(user) {
        const connections = await this.connectionRepository.findBy({ userId: user.id });
        if (connections.length === 0) {
            return [];
        }
        const sortedConnections = connections.sort((left, right) => left.id.localeCompare(right.id));
        const slugs = [...new Set(sortedConnections.map((connection) => connection.serverSlug))];
        const servers = await this.mcpRegistryService.getBySlugs(slugs);
        const serverBySlug = new Map(servers.map((server) => [server.slug, server]));
        const slugCounts = new Map();
        const aiMcpFetch = (0, ai_proxy_fetch_1.createAiMcpFetch)(this.outboundHttp);
        const resolved = [];
        for (const connection of sortedConnections) {
            const server = serverBySlug.get(connection.serverSlug);
            if (!server) {
                this.logger.warn('Skipping MCP registry connection with missing server slug', {
                    connectionId: connection.id,
                    serverSlug: connection.serverSlug,
                    userId: user.id,
                });
                continue;
            }
            const resolvedServer = this.resolveRegistryServer(connection.id, connection.serverSlug, connection.credentialId, server);
            if (!resolvedServer) {
                continue;
            }
            if (resolvedServer.authType !== 'oauth2' &&
                resolvedServer.authType !== 'extendsCredential' &&
                resolvedServer.authType !== 'usesCredentials') {
                continue;
            }
            const nextCount = (slugCounts.get(resolvedServer.serverSlug) ?? 0) + 1;
            slugCounts.set(resolvedServer.serverSlug, nextCount);
            const serverConfig = {
                name: buildServerName(resolvedServer.serverSlug, nextCount),
                url: resolvedServer.connection.endpointUrl,
                transport: (0, mcp_registry_connection_1.toAgentMcpTransport)(resolvedServer.connection.transport),
                cacheKey: `registry-connection:${connection.id}:${connection.credentialId}`,
                toolPermissions: connection.toolPermissions,
                metadata: {
                    connectionId: connection.id,
                    serverSlug: resolvedServer.serverSlug,
                    userId: user.id,
                },
            };
            if (resolvedServer.authType === 'oauth2' ||
                resolvedServer.authType === 'extendsCredential' ||
                resolvedServer.authType === 'usesCredentials') {
                const requestFetch = await this.buildRegistryServerFetch(resolvedServer, user, connection.id, aiMcpFetch);
                if (!requestFetch) {
                    continue;
                }
                serverConfig.fetch = requestFetch;
            }
            resolved.push(serverConfig);
        }
        return resolved;
    }
    resolveRegistryServer(connectionId, serverSlug, credentialId, server) {
        const connection = (0, mcp_registry_connection_1.resolveMcpRegistryConnection)(server);
        if (!connection) {
            this.logger.warn('Skipping MCP registry connection without supported remote transport', {
                connectionId,
                serverSlug,
                credentialId,
            });
            return null;
        }
        if (connection.isTemplated) {
            this.logger.warn('Skipping MCP registry connection with a templated server URL', {
                connectionId,
                serverSlug,
                credentialId,
            });
            return null;
        }
        return {
            serverSlug,
            credentialId,
            authType: server.authType,
            connection,
        };
    }
    async buildRegistryServerFetch(config, user, connectionId, baseFetch) {
        const credentialWithData = await this.getCredentialWithData(config.credentialId, user);
        if (!credentialWithData) {
            this.logger.warn('Skipping MCP registry connection with inaccessible credential', {
                connectionId,
                serverSlug: config.serverSlug,
                credentialId: config.credentialId,
                userId: user.id,
            });
            return null;
        }
        const credentialType = credentialWithData.credential.type;
        if (!(0, mcp_registry_connection_1.isSupportedMcpRegistryCredentialType)(this.credentialTypes, credentialType)) {
            this.logger.warn('Skipping MCP registry connection with unsupported credential type', {
                connectionId,
                serverSlug: config.serverSlug,
                credentialType,
            });
            return null;
        }
        const prepared = (0, mcp_registry_connection_1.prepareMcpRegistryConnection)({
            connection: config.connection,
            credentialType,
            credentialData: credentialWithData.data,
        });
        if (!prepared.ok) {
            this.logger.warn('Skipping MCP registry connection with invalid credential', {
                connectionId,
                serverSlug: config.serverSlug,
                credentialId: config.credentialId,
                reason: prepared.error.code,
            });
            return null;
        }
        const projectId = credentialWithData.credential.shared?.[0]?.projectId ?? null;
        return (0, mcp_auth_fetch_1.createMcpAuthFetch)({
            authentication: credentialType,
            baseFetch,
            credentialData: credentialWithData.data,
            credentialId: config.credentialId,
            initialHeaders: prepared.value.headers,
            oauthService: this.oauthService,
            projectId,
            allowedDomains: {
                mode: 'domains',
                domains: prepared.value.allowedDomains,
            },
        });
    }
    async getCredentialWithData(credentialId, user) {
        const credential = await this.credentialsFinderService.findCredentialForUser(credentialId, user, ['credential:read']);
        if (!credential) {
            return null;
        }
        const data = await this.credentialsService.decrypt(credential, true);
        if (!(0, backend_common_1.isObjectLiteral)(data) || Object.keys(data).length === 0) {
            return null;
        }
        return { credential, data };
    }
    async swapCredential(user, connection, newCredentialId, server) {
        const newCredential = await this.credentialsFinderService.findCredentialForUser(newCredentialId, user, ['credential:read']);
        if (!newCredential) {
            throw new errors_1.NotFoundError('Credential not found or not accessible');
        }
        this.assertCredentialAllowed(server, newCredential.type);
        connection.credentialId = newCredentialId;
    }
    assertCredentialAllowed(server, credentialType) {
        const connection = (0, mcp_registry_connection_1.resolveMcpRegistryConnection)(server);
        if (!connection ||
            !(0, mcp_registry_connection_1.isSupportedMcpRegistryCredentialType)(this.credentialTypes, credentialType) ||
            !connection.credentialBindings.some((binding) => binding.credentialType === credentialType)) {
            throw new errors_1.BadRequestError('Credential type is not supported by this MCP server');
        }
    }
};
exports.InstanceAiMcpRegistryService = InstanceAiMcpRegistryService;
exports.InstanceAiMcpRegistryService = InstanceAiMcpRegistryService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, instance_ai_mcp_registry_connection_repository_1.InstanceAiMcpRegistryConnectionRepository, mcp_registry_service_1.McpRegistryService, backend_services_1.CredentialsFinderService, credentials_service_1.CredentialsService, credential_types_1.CredentialTypes, oauth_service_1.OauthService, backend_services_1.EventService, backend_network_1.OutboundHttp, instance_ai_settings_service_1.InstanceAiSettingsService])
], InstanceAiMcpRegistryService);
//# sourceMappingURL=instance-ai-mcp-registry.service.js.map