import type { AgentJsonToolConfig } from '@n8n/api-types';
import { NodeTypes } from '../../../node-types';
import { AiGatewayService } from '../../../services/ai-gateway.service';
export declare class NodeToolAiGatewayService {
    private readonly nodeTypes;
    private readonly aiGatewayService;
    constructor(nodeTypes: NodeTypes, aiGatewayService: AiGatewayService);
    assignManagedCredentials(tools: AgentJsonToolConfig[] | undefined, ownedCredentialTypes: ReadonlySet<string>): Promise<void>;
}
