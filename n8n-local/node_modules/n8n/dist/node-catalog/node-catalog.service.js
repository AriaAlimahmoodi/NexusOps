"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeCatalogService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const constants_1 = require("@n8n/constants");
const di_1 = require("@n8n/di");
const fs = __importStar(require("fs/promises"));
const lru_cache_1 = require("lru-cache");
const path = __importStar(require("path"));
const load_nodes_and_credentials_1 = require("../load-nodes-and-credentials");
const synthesize_type_def_1 = require("../modules/mcp-registry/synthesize-type-def");
const module_gated_node_types_1 = require("./module-gated-node-types");
const registry_lookup_1 = require("./registry-lookup");
const withoutNodeTypes = (nodeFilter, excluded) => {
    if (excluded.length === 0)
        return nodeFilter;
    const excludedSet = new Set(excluded);
    return (nodeId) => !excludedSet.has(nodeId) && (nodeFilter?.(nodeId) ?? true);
};
const isBuiltinNodeId = (nodeId) => constants_1.BUILTIN_NODES_PACKAGES.some((pkg) => nodeId.startsWith(`${pkg}.`));
const nodeVersionNumbers = (description) => {
    if (Array.isArray(description.version))
        return description.version;
    if (typeof description.version === 'number')
        return [description.version];
    return [];
};
const maxNodeVersion = (description) => Math.max(0, ...nodeVersionNumbers(description));
const parseRequestedVersion = (version) => {
    const normalized = version.replace(/^v/i, '');
    if (/^\d+$/.test(normalized) && normalized.length === 2) {
        return Number(`${normalized[0]}.${normalized[1]}`);
    }
    return Number.parseFloat(normalized);
};
const versionLabel = (description) => {
    const version = maxNodeVersion(description);
    return version > 0 ? String(version) : undefined;
};
const UNFILTERED = Symbol('unfiltered');
const MAX_TYPE_DEFINITION_CACHE_BYTES = 16 * 1024 * 1024;
const UNINSTALLED_TIER_TTL_MS = 8 * 60 * 60 * 1000;
const UNINSTALLED_SECTION_HEADING = [
    '## Verified community nodes (not installed on this instance)',
    '',
    'These are published to the n8n community registry and vetted by n8n, but not installed here.',
    'A workflow using one will not run until the package is installed.',
].join('\n');
const stringBytes = (value) => (value ? Buffer.byteLength(value, 'utf8') : 0);
const definitionResultBytes = (item) => Math.max(1, stringBytes(item.content) +
    stringBytes(item.version) +
    stringBytes(item.error) +
    stringBytes(item.builderHint));
let NodeCatalogService = class NodeCatalogService {
    constructor(loadNodesAndCredentials, logger, moduleRegistry) {
        this.loadNodesAndCredentials = loadNodesAndCredentials;
        this.logger = logger;
        this.moduleRegistry = moduleRegistry;
        this.nodeDefinitionDirs = [];
        this.descriptionsById = new Map();
        this.searchStates = new Map();
        this.uninstalledDescriptionsById = new Map();
        this.uninstalledCandidates = [];
        this.uninstalledPackagesById = new Map();
        this.uninstalledBuiltAt = 0;
        this.getCache = new Map();
        this.getDefinitionCache = new lru_cache_1.LRUCache({
            maxSize: MAX_TYPE_DEFINITION_CACHE_BYTES,
            sizeCalculation: definitionResultBytes,
        });
        this.suggestCache = new Map();
        this.loadNodesAndCredentials.addPostProcessor(async () => await this.refreshNodeTypes());
    }
    async initialize() {
        this.initPromise ??= this.doInitialize();
        await this.initPromise;
    }
    getNodeTypeParser() {
        if (!this.nodeTypeParser) {
            throw new Error('NodeCatalogService not initialized. Call initialize() first.');
        }
        return this.nodeTypeParser;
    }
    getNodeDefinitionDirs() {
        return this.nodeDefinitionDirs;
    }
    async searchNodes(queries, options = {}) {
        const installed = await this.searchInstalledNodes(queries, options);
        if (!options.includeUninstalled)
            return installed;
        return await this.appendUninstalledMatches(queries, installed, options.nodeFilter);
    }
    async searchInstalledNodes(queries, options = {}) {
        const { nodeFilter } = options;
        const stateKey = nodeFilter ?? UNFILTERED;
        let state = this.searchStates.get(stateKey);
        if (!state) {
            state = { cache: new Map() };
            this.searchStates.set(stateKey, state);
        }
        const disabledNodeTypes = (0, module_gated_node_types_1.getModuleDisabledNodeTypes)(this.moduleRegistry);
        const cacheKey = JSON.stringify([disabledNodeTypes, [...queries].sort()]);
        const cached = state.cache.get(cacheKey);
        if (cached)
            return cached;
        if (!state.search) {
            const { searchCodeBuilderNodes } = await import('@n8n/ai-utilities/node-catalog');
            const nodeTypeParser = this.getNodeTypeParser();
            state.search = (searchQueries, filter) => filter
                ? searchCodeBuilderNodes(nodeTypeParser, searchQueries, { nodeFilter: filter })
                : searchCodeBuilderNodes(nodeTypeParser, searchQueries);
        }
        const result = state.search(queries, withoutNodeTypes(nodeFilter, disabledNodeTypes));
        state.cache.set(cacheKey, result);
        return result;
    }
    async appendUninstalledMatches(queries, installed, nodeFilter) {
        const parser = await this.getUninstalledParser();
        if (!parser)
            return installed;
        const { formatNodeResult } = await import('@n8n/ai-utilities/node-catalog');
        const candidates = nodeFilter
            ? this.uninstalledCandidates.filter((candidate) => nodeFilter(candidate.name))
            : this.uninstalledCandidates;
        const blocks = [];
        const answered = new Set();
        const offered = new Set();
        for (const query of queries) {
            const matches = (0, registry_lookup_1.findRegistryMatches)(query, candidates);
            const formatted = [];
            for (const match of matches) {
                const block = formatNodeResult(parser, match.name);
                if (!block)
                    continue;
                formatted.push(block);
                offered.add(match.name);
            }
            if (formatted.length === 0)
                continue;
            blocks.push(`## "${query}"\n\n${formatted.join('\n\n')}`);
            answered.add(query);
        }
        if (blocks.length === 0)
            return installed;
        return {
            results: [installed.results, UNINSTALLED_SECTION_HEADING, ...blocks].join('\n\n---\n\n'),
            queriesWithNoResults: installed.queriesWithNoResults.filter((q) => !answered.has(q)),
            uninstalledOffered: [...offered],
        };
    }
    async getUninstalledParser() {
        this.expireStaleUninstalledTier();
        this.uninstalledPromise ??= this.buildUninstalledTier();
        await this.uninstalledPromise;
        if (!this.uninstalledParser)
            this.uninstalledPromise = undefined;
        return this.uninstalledParser;
    }
    async buildUninstalledTier() {
        const entries = await this.loadUninstalledEntries();
        if (entries === null)
            return;
        if (entries.length === 0) {
            this.logger.warn('Verified community node catalog returned no entries; discovery will offer nothing');
            return;
        }
        const descriptions = entries.map((entry) => entry.description);
        const { NodeTypeParser: NodeTypeParserClass } = await import('@n8n/ai-utilities/node-catalog');
        try {
            this.uninstalledParser = new NodeTypeParserClass(descriptions);
        }
        catch (error) {
            this.logger.warn('Could not index uninstalled verified community nodes', { error });
            return;
        }
        for (const description of descriptions) {
            this.uninstalledDescriptionsById.set(description.name, description);
        }
        for (const { candidate } of entries) {
            this.uninstalledPackagesById.set(candidate.name, candidate.packageName);
        }
        this.uninstalledCandidates = entries.map((entry) => entry.candidate);
        this.uninstalledBuiltAt = Date.now();
        this.logger.debug('NodeCatalogService indexed uninstalled verified community nodes', {
            nodeTypeCount: descriptions.length,
        });
    }
    expireStaleUninstalledTier() {
        if (!this.uninstalledParser)
            return;
        if (Date.now() - this.uninstalledBuiltAt <= UNINSTALLED_TIER_TTL_MS)
            return;
        this.dropUninstalledTier();
    }
    dropUninstalledTier() {
        this.uninstalledParser = undefined;
        this.uninstalledDescriptionsById = new Map();
        this.uninstalledPackagesById = new Map();
        this.uninstalledCandidates = [];
        this.uninstalledPromise = undefined;
        this.uninstalledBuiltAt = 0;
        this.getCache.clear();
        this.getDefinitionCache.clear();
    }
    async loadUninstalledEntries() {
        try {
            const { CommunityPackagesConfig } = await import('../modules/community-packages/community-packages.config.js');
            const config = di_1.Container.get(CommunityPackagesConfig);
            if (!config.enabled || !config.verifiedEnabled)
                return null;
            const { GlobalConfig } = await import('@n8n/config');
            const { instanceSettingsLoader } = di_1.Container.get(GlobalConfig);
            if (instanceSettingsLoader.communityPackagesManagedByEnv)
                return null;
            const { CommunityNodeTypesService } = await import('../modules/community-packages/community-node-types.service.js');
            const catalog = await di_1.Container.get(CommunityNodeTypesService).getCommunityNodeTypes();
            return catalog
                .filter((entry) => entry.isOfficialNode && !entry.isInstalled)
                .filter((entry) => !this.descriptionsById.has(entry.name))
                .filter((entry) => Array.isArray(entry.nodeDescription?.properties))
                .map((entry) => ({
                description: { ...entry.nodeDescription, name: entry.name },
                candidate: {
                    name: entry.name,
                    displayName: entry.displayName,
                    numberOfDownloads: entry.numberOfDownloads,
                    packageName: entry.packageName,
                },
            }));
        }
        catch (error) {
            this.logger.warn('Could not load verified community node catalog', { error });
            return [];
        }
    }
    async getNodeTypes(nodeIds, options = {}) {
        if (options.includeUninstalled)
            this.expireStaleUninstalledTier();
        const cacheKey = JSON.stringify([
            Boolean(options.includeUninstalled),
            nodeIds.map((id) => (typeof id === 'string' ? id : JSON.stringify(id))).sort(),
        ]);
        const cached = this.getCache.get(cacheKey);
        if (cached)
            return cached;
        const onDiskIds = [];
        const synthesizeIds = [];
        for (const id of nodeIds) {
            if (this.resolvesFromDisk(this.toDefinitionRequest(id))) {
                onDiskIds.push(id);
            }
            else {
                synthesizeIds.push(id);
            }
        }
        const parts = [];
        const errors = [];
        for (const id of synthesizeIds) {
            const result = await this.getNodeTypeDefinition(this.toDefinitionRequest(id), options);
            if (result.error) {
                errors.push(result.error);
            }
            else {
                parts.push(result.content);
            }
        }
        if (onDiskIds.length > 0) {
            const { getNodeTypes } = await import('@n8n/ai-utilities/node-catalog');
            parts.push(getNodeTypes(onDiskIds, { nodeDefinitionDirs: this.nodeDefinitionDirs }));
        }
        if (errors.length > 0) {
            parts.push(`# Errors\n\n${errors.join('\n')}`);
        }
        const result = parts.join('\n\n');
        if (errors.length === 0)
            this.getCache.set(cacheKey, result);
        return result;
    }
    async getNodeTypeDefinition(request, options = {}) {
        const includeUninstalled = Boolean(options.includeUninstalled);
        if (includeUninstalled)
            this.expireStaleUninstalledTier();
        const cacheKey = JSON.stringify([includeUninstalled, request]);
        const cached = this.getDefinitionCache.get(cacheKey);
        if (cached)
            return cached;
        let result = this.resolvesFromDisk(request)
            ? await this.getBuiltinNodeTypeDefinition(request)
            : this.getSynthesizedNodeTypeDefinition(request);
        if (result.error && includeUninstalled) {
            result = await this.getUninstalledNodeTypeDefinition(request, result);
        }
        if (!result.error) {
            this.getDefinitionCache.set(cacheKey, result);
        }
        return result;
    }
    async findUninstalledNodeTypes(nodeTypeNames) {
        if (nodeTypeNames.length === 0)
            return [];
        const unknown = [...new Set(nodeTypeNames)].filter((nodeType) => !this.descriptionsById.has(nodeType));
        if (unknown.length === 0)
            return [];
        await this.getUninstalledParser();
        if (this.uninstalledDescriptionsById.size === 0)
            return [];
        const found = [];
        for (const nodeType of unknown) {
            if (!this.uninstalledDescriptionsById.has(nodeType))
                continue;
            const packageName = this.uninstalledPackagesById.get(nodeType);
            if (!packageName)
                continue;
            found.push({ nodeType, packageName });
        }
        return found;
    }
    async getUninstalledNodeTypeDefinition(request, installedResult) {
        await this.getUninstalledParser();
        const description = this.uninstalledDescriptionsById.get(request.nodeId);
        if (!description)
            return installedResult;
        try {
            const version = versionLabel(description);
            const packageName = this.uninstalledPackagesById.get(request.nodeId) ?? request.nodeId;
            return {
                content: [
                    `// NOT INSTALLED: this node ships in the community package '${packageName}',`,
                    '// which is not installed on this instance. Install it before the workflow can run.',
                    (0, synthesize_type_def_1.synthesizeNodeTypeDef)(description),
                ].join('\n'),
                ...(version ? { version } : {}),
            };
        }
        catch (error) {
            this.logger.debug('Could not synthesize uninstalled node type definition', {
                nodeId: request.nodeId,
                error,
            });
            return installedResult;
        }
    }
    async getSuggestedNodes(categories) {
        const cacheKey = JSON.stringify([...categories].sort());
        const cached = this.suggestCache.get(cacheKey);
        if (cached)
            return cached;
        const { getSuggestedNodes } = await import('@n8n/ai-utilities/node-catalog');
        const result = getSuggestedNodes(this.getNodeTypeParser(), categories);
        this.suggestCache.set(cacheKey, result);
        return result;
    }
    async doInitialize() {
        const { NodeTypeParser: NodeTypeParserClass } = await import('@n8n/ai-utilities/node-catalog');
        const { setSchemaBaseDirs } = await import('@n8n/workflow-sdk');
        await this.loadNodesAndCredentials.postProcessLoaders();
        const { nodes: nodeTypeDescriptions } = await this.loadNodesAndCredentials.collectTypes();
        this.nodeTypeParser = new NodeTypeParserClass(nodeTypeDescriptions);
        this.indexDescriptions(nodeTypeDescriptions);
        this.nodeDefinitionDirs = await this.resolveBuiltinNodeDefinitionDirs();
        setSchemaBaseDirs(this.nodeDefinitionDirs);
        this.logger.debug('NodeCatalogService initialized', {
            nodeTypeCount: nodeTypeDescriptions.length,
            nodeDefinitionDirs: this.nodeDefinitionDirs.length,
        });
    }
    async refreshNodeTypes() {
        if (!this.nodeTypeParser)
            return;
        const { NodeTypeParser: NodeTypeParserClass } = await import('@n8n/ai-utilities/node-catalog');
        const { nodes: nodeTypeDescriptions } = await this.loadNodesAndCredentials.collectTypes();
        this.nodeTypeParser = new NodeTypeParserClass(nodeTypeDescriptions);
        this.indexDescriptions(nodeTypeDescriptions);
        this.searchStates.clear();
        this.dropUninstalledTier();
        this.getCache.clear();
        this.getDefinitionCache.clear();
        this.suggestCache.clear();
        this.logger.debug('NodeCatalogService refreshed node types', {
            nodeTypeCount: nodeTypeDescriptions.length,
        });
    }
    indexDescriptions(descriptions) {
        this.descriptionsById.clear();
        for (const description of descriptions) {
            const existing = this.descriptionsById.get(description.name);
            if (existing) {
                existing.push(description);
            }
            else {
                this.descriptionsById.set(description.name, [description]);
            }
        }
    }
    resolvesFromDisk(request) {
        if (!isBuiltinNodeId(request.nodeId))
            return false;
        const candidates = this.descriptionsById.get(request.nodeId);
        if (!candidates?.length)
            return true;
        const description = this.selectDescription(candidates, request.version);
        return description?.hidden !== true;
    }
    toDefinitionRequest(nodeRequest) {
        if (typeof nodeRequest === 'string')
            return { nodeId: nodeRequest };
        return {
            nodeId: nodeRequest.nodeId,
            ...(nodeRequest.version ? { version: nodeRequest.version } : {}),
            ...(nodeRequest.resource ? { resource: nodeRequest.resource } : {}),
            ...(nodeRequest.operation ? { operation: nodeRequest.operation } : {}),
            ...(nodeRequest.mode ? { mode: nodeRequest.mode } : {}),
        };
    }
    async getBuiltinNodeTypeDefinition(request) {
        const { getNodeTypeDefinition } = await import('@n8n/ai-utilities/node-catalog');
        const result = getNodeTypeDefinition(request.nodeId, request.version, this.nodeDefinitionDirs, {
            resource: request.resource,
            operation: request.operation,
            mode: request.mode,
        });
        const candidates = this.descriptionsById.get(request.nodeId);
        const description = candidates
            ? this.selectDescription(candidates, result.version ?? request.version)
            : undefined;
        const builderHint = description?.builderHint?.searchHint;
        if (result.error) {
            return {
                content: '',
                error: result.error,
                ...(builderHint ? { builderHint } : {}),
            };
        }
        return {
            content: result.content,
            ...(result.version ? { version: result.version } : {}),
            ...(builderHint ? { builderHint } : {}),
            ...(description?.hidden ? { deprecated: true } : {}),
        };
    }
    getSynthesizedNodeTypeDefinition(request) {
        const candidates = this.descriptionsById.get(request.nodeId);
        if (!candidates?.length) {
            return {
                content: '',
                error: `Node type '${request.nodeId}' not found. Use search_nodes to find the correct node ID.`,
            };
        }
        const description = this.selectDescription(candidates, request.version);
        if (!description) {
            return {
                content: '',
                error: this.versionNotFoundError(request.nodeId, request.version, candidates),
            };
        }
        try {
            const version = versionLabel(description);
            return {
                content: (0, synthesize_type_def_1.synthesizeNodeTypeDef)(description),
                ...(version ? { version } : {}),
                ...(description.builderHint?.searchHint
                    ? { builderHint: description.builderHint.searchHint }
                    : {}),
                ...(description.hidden ? { deprecated: true } : {}),
            };
        }
        catch (error) {
            this.logger.debug('Could not synthesize node type definition', {
                nodeId: request.nodeId,
                error,
            });
            return {
                content: '',
                error: `Type definition for '${request.nodeId}' could not be generated from the node's description.`,
            };
        }
    }
    selectDescription(candidates, requestedVersion) {
        if (requestedVersion !== undefined) {
            const wanted = parseRequestedVersion(requestedVersion);
            return candidates.find((d) => nodeVersionNumbers(d).includes(wanted));
        }
        return candidates.reduce((latest, d) => maxNodeVersion(d) > maxNodeVersion(latest) ? d : latest);
    }
    versionNotFoundError(nodeId, requestedVersion, candidates) {
        const available = [...new Set(candidates.flatMap(nodeVersionNumbers))].sort((a, b) => a - b);
        return `Version '${requestedVersion}' not found for node '${nodeId}'. Available versions: ${available.join(', ')}.`;
    }
    async resolveBuiltinNodeDefinitionDirs() {
        const dirs = [];
        for (const packageId of constants_1.BUILTIN_NODES_PACKAGES) {
            try {
                const packageJsonPath = require.resolve(`${packageId}/package.json`);
                const distDir = path.dirname(packageJsonPath);
                let nodeDefsDir = path.join(distDir, 'dist', 'node-definitions');
                const separator = process.platform === 'win32' ? '\\' : '/';
                if (!nodeDefsDir.endsWith(separator)) {
                    nodeDefsDir += separator;
                }
                await fs.access(nodeDefsDir);
                dirs.push(nodeDefsDir);
            }
            catch (error) {
                this.logger.debug(`Could not resolve node definitions for ${packageId}`, { error });
            }
        }
        return dirs;
    }
};
exports.NodeCatalogService = NodeCatalogService;
exports.NodeCatalogService = NodeCatalogService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [load_nodes_and_credentials_1.LoadNodesAndCredentials, backend_common_1.Logger, backend_common_1.ModuleRegistry])
], NodeCatalogService);
//# sourceMappingURL=node-catalog.service.js.map