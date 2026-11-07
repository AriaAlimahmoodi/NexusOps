import { Logger } from '@n8n/backend-common';
import { CredentialTypes } from '../../../credential-types';
import { type McpRegistryServer } from './mcp-registry.types';
export type McpRegistryServerMetadata = Pick<McpRegistryServer, 'slug' | 'version' | 'updatedAt'>;
export declare class McpRegistryApiClient {
    private readonly logger;
    private readonly credentialTypes;
    constructor(logger: Logger, credentialTypes: CredentialTypes);
    fetchAllServers(signal?: AbortSignal): Promise<McpRegistryServer[]>;
    fetchServersMetadata(signal?: AbortSignal): Promise<McpRegistryServerMetadata[]>;
    fetchServersBySlugs(slugs: string[], signal?: AbortSignal): Promise<McpRegistryServer[]>;
    private getUrl;
    private parseServers;
    private withSupportedCredentials;
}
