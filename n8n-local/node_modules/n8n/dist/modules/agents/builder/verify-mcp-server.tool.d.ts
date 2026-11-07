import type { BuiltTool, CredentialProvider } from '@n8n/agents';
import { type AgentJsonConfig } from '@n8n/api-types';
import type { CustomFetch } from '@n8n/backend-network';
import type { OauthService } from '../../../oauth/oauth.service';
import { type BuildMcpClientDeps } from '../json-config/mcp-client-factory';
export type McpCredentialApplyResult = {
    applied: false;
} | {
    applied: true;
    config: AgentJsonConfig;
    configHash: string;
};
export interface VerifyMcpServerDeps {
    agentId?: string;
    credentialProvider: CredentialProvider;
    oauthService: OauthService;
    projectId: string;
    proxyFetch: CustomFetch;
    resolveRegistryConnection?: BuildMcpClientDeps['resolveRegistryConnection'];
    applyCredentialToMcpServer?: (serverName: string, credentialId: string) => Promise<McpCredentialApplyResult>;
}
export declare function buildVerifyMcpServerTool(deps: VerifyMcpServerDeps): BuiltTool;
