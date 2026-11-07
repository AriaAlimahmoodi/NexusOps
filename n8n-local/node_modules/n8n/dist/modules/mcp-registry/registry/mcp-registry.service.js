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
exports.McpRegistryService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const load_nodes_and_credentials_1 = require("../../../load-nodes-and-credentials");
const push_1 = require("../../../push");
const publisher_service_1 = require("../../../scaling/pubsub/publisher.service");
const mcp_registry_server_repository_1 = require("./mcp-registry-server.repository");
const mcp_registry_node_loader_1 = require("../mcp-registry-node-loader");
const mcp_registry_api_client_1 = require("./mcp-registry-api.client");
const mcp_registry_capabilities_1 = require("./mcp-registry-capabilities");
const mcp_registry_search_1 = require("./mcp-registry-search");
const mcp_registry_types_1 = require("./mcp-registry.types");
const node_description_transform_1 = require("../node-description-transform");
let McpRegistryService = class McpRegistryService {
    constructor(logger, repository, apiClient, capabilities, instanceSettings, loadNodesAndCredentials, push, publisher) {
        this.logger = logger;
        this.repository = repository;
        this.apiClient = apiClient;
        this.capabilities = capabilities;
        this.instanceSettings = instanceSettings;
        this.loadNodesAndCredentials = loadNodesAndCredentials;
        this.push = push;
        this.publisher = publisher;
        this.logger = logger.scoped('mcp-registry');
    }
    async init() {
        await this.refreshRegistryNodeTypes(false);
    }
    async handleReloadMcpRegistry() {
        await this.refreshRegistryNodeTypes(true);
        if (this.isMainInstance()) {
            this.notifyNodeDescriptionsUpdated();
        }
    }
    async getAll({ includeDeprecated = false, } = {}) {
        const servers = await this.getStoredServers(includeDeprecated);
        return servers.filter(({ requiredCapabilities }) => this.capabilities.supports(requiredCapabilities));
    }
    async get(slug) {
        const entity = await this.repository.findOneBy({ slug });
        if (!entity)
            return undefined;
        const server = (0, mcp_registry_types_1.fromEntity)(entity);
        return this.capabilities.supports(server.requiredCapabilities) ? server : undefined;
    }
    async getBySlugs(slugs) {
        if (slugs.length === 0) {
            return [];
        }
        const entities = await this.repository.findBy(slugs.map((slug) => ({ slug })));
        return entities
            .map(mcp_registry_types_1.fromEntity)
            .filter(({ requiredCapabilities }) => this.capabilities.supports(requiredCapabilities));
    }
    async search(queries) {
        return (0, mcp_registry_search_1.searchMcpRegistryServers)(await this.getAll(), queries);
    }
    async list(limit) {
        return (0, mcp_registry_search_1.listMcpRegistryServers)(await this.getAll()).slice(0, limit);
    }
    async resolveBySlugs(slugs) {
        const servers = await this.getBySlugs(slugs);
        return (0, mcp_registry_search_1.listMcpRegistryServers)(servers.filter((server) => server.status === 'active'));
    }
    async getConnection(nodeTypeName) {
        const loader = this.loadNodesAndCredentials.loaders[node_description_transform_1.MCP_REGISTRY_PACKAGE_NAME];
        if (!(loader instanceof mcp_registry_node_loader_1.McpRegistryNodeLoader))
            return undefined;
        return loader.getConnection(nodeTypeName);
    }
    async refreshFromApi(signal) {
        const existingServers = await this.getStoredServers(true);
        const fetchedAt = await this.repository.readDbNow();
        let updatedServers;
        if (existingServers.length === 0) {
            updatedServers = await this.apiClient.fetchAllServers(signal);
        }
        else {
            const result = await this.refreshUpdatedServers(existingServers, signal);
            if (result === null) {
                this.logger.debug('MCP registry is up to date');
                return;
            }
            updatedServers = result;
        }
        signal?.throwIfAborted();
        await this.saveServers(updatedServers, fetchedAt);
        await this.refreshRegistryNodeTypes(true);
        this.notifyNodeDescriptionsUpdated();
        await this.publishReloadCommand();
        this.logger.debug('MCP registry refreshed', { serverCount: updatedServers.length });
    }
    async getStoredServers(includeDeprecated) {
        const entities = includeDeprecated
            ? await this.repository.find()
            : await this.repository.findBy({ status: 'active' });
        return entities.map(mcp_registry_types_1.fromEntity);
    }
    async refreshUpdatedServers(existingServers, signal) {
        const now = new Date().toISOString();
        const metadata = await this.apiClient.fetchServersMetadata(signal);
        const existingBySlug = new Map(existingServers.map((server) => [server.slug, server]));
        const metadataSlugs = new Set(metadata.map(({ slug }) => slug));
        const slugsToFetch = metadata
            .filter((entry) => this.shouldFetchFullServer(entry, existingBySlug.get(entry.slug)))
            .map(({ slug }) => slug);
        const serversToDeprecate = existingServers
            .filter((server) => !metadataSlugs.has(server.slug) && server.status !== 'deprecated')
            .map((server) => ({ ...server, status: 'deprecated', updatedAt: now }));
        if (slugsToFetch.length === 0 && serversToDeprecate.length === 0) {
            return null;
        }
        if (slugsToFetch.length === 0) {
            return serversToDeprecate;
        }
        const updatedServers = await this.apiClient.fetchServersBySlugs(slugsToFetch, signal);
        return [...updatedServers, ...serversToDeprecate];
    }
    shouldFetchFullServer(metadata, existing) {
        return (!existing ||
            existing.version !== metadata.version ||
            existing.updatedAt !== metadata.updatedAt);
    }
    async saveServers(servers, fetchedAt) {
        const entities = servers.map(mcp_registry_types_1.toEntity);
        await this.repository.upsertFetchedServers(entities, fetchedAt);
    }
    async refreshRegistryNodeTypes(releaseTypes) {
        const loader = this.loadNodesAndCredentials.loaders[node_description_transform_1.MCP_REGISTRY_PACKAGE_NAME];
        if (!loader) {
            return;
        }
        if (!(loader instanceof mcp_registry_node_loader_1.McpRegistryNodeLoader)) {
            this.logger.warn('Unexpected MCP registry loader instance type', {
                loaderType: loader.constructor.name,
            });
            return;
        }
        const servers = await this.getAll({ includeDeprecated: true });
        loader.setServers(servers);
        await loader.loadAll();
        await this.loadNodesAndCredentials.postProcessLoaders();
        if (releaseTypes) {
            this.loadNodesAndCredentials.releaseTypes();
        }
        this.logger.debug('MCP registry loader done', { serverCount: servers.length });
    }
    async publishReloadCommand() {
        await this.publisher.publishCommand({ command: 'reload-mcp-registry' });
    }
    notifyNodeDescriptionsUpdated() {
        this.push.broadcast({ type: 'nodeDescriptionUpdated', data: {} });
    }
    isMainInstance() {
        return this.instanceSettings.instanceType === 'main';
    }
};
exports.McpRegistryService = McpRegistryService;
__decorate([
    (0, decorators_1.OnPubSubEvent)('reload-mcp-registry'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], McpRegistryService.prototype, "handleReloadMcpRegistry", null);
exports.McpRegistryService = McpRegistryService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, mcp_registry_server_repository_1.McpRegistryServerRepository, mcp_registry_api_client_1.McpRegistryApiClient, mcp_registry_capabilities_1.McpRegistryCapabilities, n8n_core_1.InstanceSettings, load_nodes_and_credentials_1.LoadNodesAndCredentials, push_1.Push, publisher_service_1.Publisher])
], McpRegistryService);
//# sourceMappingURL=mcp-registry.service.js.map