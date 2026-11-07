import type { AgentJsonToolConfig, AiGatewayConfigDto } from '@n8n/api-types';
import type { NodeTypes } from '../../../node-types';
export declare function reconcileNodeToolGatewayCredentials(tools: AgentJsonToolConfig[] | undefined, nodeTypes: NodeTypes, aiGatewayConfig: AiGatewayConfigDto | undefined, ownedCredentialTypes: ReadonlySet<string>): void;
export declare function listAiGatewayManagedCredentialTypes(tools: AgentJsonToolConfig[] | undefined, nodeTypes: NodeTypes): string[];
export declare function assignCredentialToNodeTools(tools: AgentJsonToolConfig[] | undefined, nodeTypes: NodeTypes, credentialType: string, credential: {
    id: string;
    name: string;
}): number;
