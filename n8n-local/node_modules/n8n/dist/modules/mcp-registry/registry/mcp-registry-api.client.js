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
exports.McpRegistryApiClient = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const credential_types_1 = require("../../../credential-types");
const strapi_utils_1 = require("../../../utils/strapi-utils");
const mcp_registry_connection_1 = require("../mcp-registry-connection");
const mcp_registry_types_1 = require("./mcp-registry.types");
const MCP_SERVERS_DEV_URL = 'http://127.0.0.1:1337/api/mcp-servers';
const MCP_SERVERS_STAGING_URL = 'https://api-staging.n8n.io/api/mcp-servers';
const MCP_SERVERS_PRODUCTION_URL = 'https://api.n8n.io/api/mcp-servers';
const STRAPI_ARRAY_LIMIT = 100;
const STRAPI_API_VERSION = 4;
let McpRegistryApiClient = class McpRegistryApiClient {
    constructor(logger, credentialTypes) {
        this.logger = logger;
        this.credentialTypes = credentialTypes;
    }
    async fetchAllServers(signal) {
        const servers = await (0, strapi_utils_1.paginatedRequest)(this.getUrl(), {
            version: STRAPI_API_VERSION,
            pagination: { page: 1, pageSize: 25 },
        }, {
            throwOnError: true,
            abortSignal: signal,
        });
        return this.parseServers(servers);
    }
    async fetchServersMetadata(signal) {
        return await (0, strapi_utils_1.paginatedRequest)(this.getUrl(), {
            version: STRAPI_API_VERSION,
            fields: ['slug', 'version', 'updatedAt'],
            pagination: { page: 1, pageSize: 500 },
        }, {
            throwOnError: true,
            abortSignal: signal,
        });
    }
    async fetchServersBySlugs(slugs, signal) {
        const data = [];
        for (let i = 0; i < slugs.length; i += STRAPI_ARRAY_LIMIT) {
            const batch = slugs.slice(i, i + STRAPI_ARRAY_LIMIT);
            const batchData = await (0, strapi_utils_1.paginatedRequest)(this.getUrl(), {
                version: STRAPI_API_VERSION,
                filters: {
                    slug: {
                        $in: batch,
                    },
                },
                pagination: { page: 1, pageSize: 25 },
            }, {
                throwOnError: true,
                abortSignal: signal,
            });
            data.push(...this.parseServers(batchData));
        }
        return data;
    }
    getUrl() {
        switch (process.env.ENVIRONMENT) {
            case 'dev':
                return process.env.N8N_MCP_SERVERS_DEV_URL || MCP_SERVERS_DEV_URL;
            case 'staging':
                return MCP_SERVERS_STAGING_URL;
            default:
                return MCP_SERVERS_PRODUCTION_URL;
        }
    }
    parseServers(servers) {
        const parsedServers = servers
            .map(mcp_registry_types_1.parseMcpRegistryServer)
            .map((server) => (server ? this.withSupportedCredentials(server) : null))
            .filter((server) => server !== null);
        const skippedCount = servers.length - parsedServers.length;
        if (skippedCount > 0) {
            this.logger.warn('Skipped invalid MCP registry entries', { skippedCount });
        }
        return parsedServers;
    }
    withSupportedCredentials(server) {
        if (server.authType === 'extendsCredential') {
            return server.extendsCredential &&
                (0, mcp_registry_connection_1.isSupportedMcpRegistryCredentialType)(this.credentialTypes, server.extendsCredential.extends)
                ? server
                : null;
        }
        if (server.authType !== 'usesCredentials')
            return server;
        const usesCredentials = (server.usesCredentials ?? []).filter(({ credentialType }) => (0, mcp_registry_connection_1.isSupportedMcpRegistryCredentialType)(this.credentialTypes, credentialType));
        return usesCredentials.length > 0 ? { ...server, usesCredentials } : null;
    }
};
exports.McpRegistryApiClient = McpRegistryApiClient;
exports.McpRegistryApiClient = McpRegistryApiClient = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, credential_types_1.CredentialTypes])
], McpRegistryApiClient);
//# sourceMappingURL=mcp-registry-api.client.js.map