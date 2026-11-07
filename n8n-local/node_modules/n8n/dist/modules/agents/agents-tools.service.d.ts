import type { BuiltTool, CredentialProvider } from '@n8n/agents';
import type { CodeBuilderSearchResult } from '@n8n/ai-utilities/node-catalog';
import { NodeCatalogService } from '../../node-catalog';
export declare const isExecutableNodeType: (nodeId: string) => boolean;
export declare const isAgentToolNodeType: (nodeId: string) => boolean;
export declare class AgentsToolsService {
    private readonly nodeCatalogService;
    constructor(nodeCatalogService: NodeCatalogService);
    getSharedTools(credentialProvider: CredentialProvider, listCredentialsUsageHint: string): BuiltTool[];
    searchAgentToolNodes(queries: string[]): Promise<CodeBuilderSearchResult>;
    private buildSearchNodesTool;
    private buildGetNodeTypesTool;
    private buildListCredentialsTool;
}
