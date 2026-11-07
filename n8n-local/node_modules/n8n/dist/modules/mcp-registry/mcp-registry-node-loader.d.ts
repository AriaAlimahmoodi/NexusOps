import type { Logger } from '@n8n/backend-common';
import { type ICredentialType, type INodeType, type INodeTypeDescription, type IVersionedNodeType, type KnownNodesAndCredentials, type LoadedClass, type McpRegistryConnection, type NodeLoader } from 'n8n-workflow';
import type { LoadNodesAndCredentials } from '../../load-nodes-and-credentials';
import type { McpRegistryServer } from './registry/mcp-registry.types';
export declare class McpRegistryNodeLoader implements NodeLoader {
    private readonly loadNodesAndCredentials;
    private readonly logger;
    packageName: string;
    known: KnownNodesAndCredentials;
    types: {
        nodes: INodeTypeDescription[];
        credentials: ICredentialType[];
    };
    private nodeTypes;
    private credentialTypes;
    private typesReleased;
    private servers;
    private connections;
    constructor(loadNodesAndCredentials: LoadNodesAndCredentials, logger: Logger);
    setServers(servers: McpRegistryServer[]): void;
    loadAll(): Promise<void>;
    getConnection(nodeTypeName: string): McpRegistryConnection | undefined;
    getNode(nodeType: string): LoadedClass<INodeType | IVersionedNodeType>;
    getCredential(credentialType: string): LoadedClass<ICredentialType>;
    reset(): void;
    releaseTypes(): void;
    ensureTypesLoaded(): Promise<void>;
    resolveSourcePath(sourcePath: string): string;
    private resolveBaseNode;
    private getCredentialTypes;
    private getParentCredentialTypes;
}
