import type { CredentialProvider, McpClient, McpServerConfig, McpConnectionFailedEvent } from '@n8n/agents';
import type { AgentJsonMcpServerConfig } from '@n8n/api-types';
import type { CustomFetch } from '@n8n/backend-network';
import type { McpRegistryConnection } from 'n8n-workflow';
import type { OauthService } from '../../../oauth/oauth.service';
export interface BuildMcpClientDeps {
    credentialProvider: CredentialProvider;
    resolveRegistryConnection?: (nodeTypeName: string) => Promise<McpRegistryConnection | undefined>;
    oauthService: OauthService;
    projectId: string;
    proxyFetch: CustomFetch;
    onConnectionFailed?: (event: McpConnectionFailedEvent) => void;
    onToolCallSettled?: McpServerConfig['onToolCallSettled'];
    nonInterrupting?: boolean;
}
export declare function buildMcpClientForServer(server: AgentJsonMcpServerConfig, deps: BuildMcpClientDeps): Promise<McpClient>;
export declare function listMcpServerTools(server: AgentJsonMcpServerConfig, deps: BuildMcpClientDeps): Promise<Array<{
    name: string;
    description: string;
}>>;
