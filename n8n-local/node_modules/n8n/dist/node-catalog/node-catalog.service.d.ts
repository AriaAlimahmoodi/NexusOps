import type { CodeBuilderSearchResult, NodeRequest, NodeTypeParser } from '@n8n/ai-utilities/node-catalog';
import { Logger, ModuleRegistry } from '@n8n/backend-common';
import { LoadNodesAndCredentials } from '../load-nodes-and-credentials';
export type NodeFilter = (nodeId: string) => boolean;
export interface CatalogScopeOptions {
    includeUninstalled?: boolean;
}
export interface CatalogSearchResult extends CodeBuilderSearchResult {
    uninstalledOffered?: string[];
}
export interface SearchNodesOptions extends CatalogScopeOptions {
    nodeFilter?: NodeFilter;
}
export interface NodeTypeDefinitionRequest {
    nodeId: string;
    version?: string;
    resource?: string;
    operation?: string;
    mode?: string;
}
export interface NodeTypeDefinitionResult {
    content: string;
    version?: string;
    error?: string;
    builderHint?: string;
    deprecated?: boolean;
}
export declare class NodeCatalogService {
    private readonly loadNodesAndCredentials;
    private readonly logger;
    private readonly moduleRegistry;
    private nodeTypeParser;
    private nodeDefinitionDirs;
    private descriptionsById;
    private initPromise;
    private readonly searchStates;
    private uninstalledParser;
    private uninstalledDescriptionsById;
    private uninstalledCandidates;
    private uninstalledPackagesById;
    private uninstalledPromise;
    private uninstalledBuiltAt;
    private readonly getCache;
    private readonly getDefinitionCache;
    private readonly suggestCache;
    constructor(loadNodesAndCredentials: LoadNodesAndCredentials, logger: Logger, moduleRegistry: ModuleRegistry);
    initialize(): Promise<void>;
    getNodeTypeParser(): NodeTypeParser;
    getNodeDefinitionDirs(): string[];
    searchNodes(queries: string[], options?: SearchNodesOptions): Promise<CatalogSearchResult>;
    private searchInstalledNodes;
    private appendUninstalledMatches;
    private getUninstalledParser;
    private buildUninstalledTier;
    private expireStaleUninstalledTier;
    private dropUninstalledTier;
    private loadUninstalledEntries;
    getNodeTypes(nodeIds: NodeRequest[], options?: CatalogScopeOptions): Promise<string>;
    getNodeTypeDefinition(request: NodeTypeDefinitionRequest, options?: CatalogScopeOptions): Promise<NodeTypeDefinitionResult>;
    findUninstalledNodeTypes(nodeTypeNames: string[]): Promise<Array<{
        nodeType: string;
        packageName: string;
    }>>;
    private getUninstalledNodeTypeDefinition;
    getSuggestedNodes(categories: string[]): Promise<string>;
    private doInitialize;
    private refreshNodeTypes;
    private indexDescriptions;
    private resolvesFromDisk;
    private toDefinitionRequest;
    private getBuiltinNodeTypeDefinition;
    private getSynthesizedNodeTypeDefinition;
    private selectDescription;
    private versionNotFoundError;
    private resolveBuiltinNodeDefinitionDirs;
}
