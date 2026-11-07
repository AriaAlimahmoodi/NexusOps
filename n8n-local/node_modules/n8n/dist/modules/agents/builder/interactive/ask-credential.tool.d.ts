import type { BuiltTool } from '@n8n/agents';
import type { CredentialSetupDeps } from './setup-tool.types';
export interface AskEmbeddingCredentialToolDeps extends CredentialSetupDeps {
    isAssistantProxyEnabled: () => boolean;
}
export declare function buildAskCredentialTool(deps: CredentialSetupDeps): BuiltTool;
export declare function buildAskEmbeddingCredentialTool(deps: AskEmbeddingCredentialToolDeps): BuiltTool;
