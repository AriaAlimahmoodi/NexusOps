"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpRegistryNodeLoader = void 0;
const change_case_1 = require("change-case");
const n8n_core_1 = require("n8n-core");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const n8n_workflow_1 = require("n8n-workflow");
const node_description_transform_1 = require("./node-description-transform");
const mcp_registry_connection_1 = require("./mcp-registry-connection");
function supportsRegistryRuntime(node) {
    return 'setRegistryRuntime' in node && typeof node.setRegistryRuntime === 'function';
}
class McpRegistryNodeLoader {
    constructor(loadNodesAndCredentials, logger) {
        this.loadNodesAndCredentials = loadNodesAndCredentials;
        this.logger = logger;
        this.packageName = node_description_transform_1.MCP_REGISTRY_PACKAGE_NAME;
        this.known = { nodes: {}, credentials: {} };
        this.types = {
            nodes: [],
            credentials: [],
        };
        this.nodeTypes = {};
        this.credentialTypes = {};
        this.typesReleased = true;
        this.servers = [];
        this.connections = new Map();
    }
    setServers(servers) {
        this.servers = servers;
    }
    async loadAll() {
        this.reset();
        const baseLoaded = this.resolveBaseNode();
        this.typesReleased = false;
        if (!baseLoaded)
            return;
        const { type: baseNode, sourcePath } = baseLoaded;
        const { description: baseDescription } = n8n_workflow_1.NodeHelpers.getVersionedNodeType(baseNode);
        const credentialTypes = this.getCredentialTypes();
        const isKnownCredentialType = (name) => (0, mcp_registry_connection_1.isSupportedMcpRegistryCredentialType)(credentialTypes, name);
        for (const server of this.servers) {
            const nodeDescription = (0, node_description_transform_1.serverToNodeDescription)(server, baseDescription, isKnownCredentialType);
            const credentialDescription = (0, node_description_transform_1.serverToCredentialDescription)(server, isKnownCredentialType);
            if (!nodeDescription)
                continue;
            if (server.authType !== 'usesCredentials' && !credentialDescription)
                continue;
            const bareName = (0, change_case_1.camelCase)(server.slug);
            const connection = (0, mcp_registry_connection_1.resolveMcpRegistryConnection)(server);
            if (!connection)
                continue;
            const supportedCredentialTypes = new Set(nodeDescription.credentials?.map(({ name }) => name) ?? []);
            this.connections.set(connection.nodeTypeName, {
                ...connection,
                credentialBindings: connection.credentialBindings.filter(({ credentialType }) => supportedCredentialTypes.has(credentialType)),
            });
            this.types.nodes.push(nodeDescription);
            const syntheticNode = Object.create(baseNode, {
                description: { value: nodeDescription, enumerable: true },
            });
            this.nodeTypes[bareName] = { type: syntheticNode, sourcePath };
            this.known.nodes[bareName] = {
                className: 'McpRegistryClientTool',
                sourcePath,
            };
            if (credentialDescription) {
                this.types.credentials.push(credentialDescription);
                this.credentialTypes[credentialDescription.name] = {
                    type: credentialDescription,
                    sourcePath: '',
                };
                this.known.credentials[credentialDescription.name] = {
                    className: 'McpRegistryApi',
                    sourcePath: '',
                    extends: credentialDescription.extends,
                    supportedNodes: [bareName],
                };
            }
        }
        if (supportsRegistryRuntime(baseNode)) {
            baseNode.setRegistryRuntime({
                resolveConnection: (nodeTypeName, selector) => {
                    const connection = this.connections.get(nodeTypeName);
                    if (!connection)
                        return undefined;
                    const binding = connection.credentialBindings.length === 1
                        ? connection.credentialBindings[0]
                        : connection.credentialBindings.find((candidate) => candidate.selector === selector);
                    return binding ? { connection, binding } : undefined;
                },
                prepareConnection: mcp_registry_connection_1.prepareMcpRegistryConnection,
            });
        }
    }
    getConnection(nodeTypeName) {
        return this.connections.get(nodeTypeName);
    }
    getNode(nodeType) {
        const entry = this.nodeTypes[nodeType];
        if (!entry)
            throw new n8n_core_1.UnrecognizedNodeTypeError(this.packageName, nodeType);
        return entry;
    }
    getCredential(credentialType) {
        const entry = this.credentialTypes[credentialType];
        if (!entry)
            throw new n8n_core_1.UnrecognizedCredentialTypeError(credentialType);
        return entry;
    }
    reset() {
        this.known = { nodes: {}, credentials: {} };
        this.types = { nodes: [], credentials: [] };
        this.nodeTypes = {};
        this.credentialTypes = {};
        this.connections.clear();
        this.typesReleased = true;
    }
    releaseTypes() {
        this.types = { nodes: [], credentials: [] };
        this.typesReleased = true;
    }
    async ensureTypesLoaded() {
        if (this.typesReleased)
            await this.loadAll();
    }
    resolveSourcePath(sourcePath) {
        return sourcePath;
    }
    resolveBaseNode() {
        const langchainLoader = this.loadNodesAndCredentials.loaders[node_description_transform_1.LANGCHAIN_PACKAGE_NAME];
        if (!langchainLoader) {
            this.logger.warn(`McpRegistryNodeLoader: langchain package "${node_description_transform_1.LANGCHAIN_PACKAGE_NAME}" is not loaded; registry nodes will not be available.`);
            return undefined;
        }
        try {
            return langchainLoader.getNode(node_description_transform_1.MCP_REGISTRY_BASE_NODE_NAME);
        }
        catch (error) {
            this.logger.warn(`McpRegistryNodeLoader: failed to resolve base node "${node_description_transform_1.MCP_REGISTRY_BASE_NODE_NAME}"`, { error: (0, ensure_error_1.ensureError)(error) });
            return undefined;
        }
    }
    getCredentialTypes() {
        return {
            recognizes: (name) => Object.hasOwn(this.loadNodesAndCredentials.knownCredentials, name),
            getByName: (name) => this.loadNodesAndCredentials.getCredential(name).type,
            getSupportedNodes: (name) => this.loadNodesAndCredentials.knownCredentials[name]?.supportedNodes ?? [],
            getParentTypes: (name) => this.getParentCredentialTypes(name),
        };
    }
    getParentCredentialTypes(name, seen = new Set()) {
        if (seen.has(name))
            return [];
        seen.add(name);
        const parents = this.loadNodesAndCredentials.knownCredentials[name]?.extends ?? [];
        return parents.flatMap((parent) => [parent, ...this.getParentCredentialTypes(parent, seen)]);
    }
}
exports.McpRegistryNodeLoader = McpRegistryNodeLoader;
//# sourceMappingURL=mcp-registry-node-loader.js.map