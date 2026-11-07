import type { AiGatewayConfigDto } from '@n8n/api-types';
import type { User } from '@n8n/db';
import type { INode, IWorkflowBase } from 'n8n-workflow';
import type { CredentialsService } from '../../../../credentials/credentials.service';
import type { NodeTypes } from '../../../../node-types';
import { type AiGatewayEligibilityReason } from '../../../../services/ai-gateway-eligibility';
import type { AiGatewayService } from '../../../../services/ai-gateway.service';
import type { Telemetry } from '../../../../telemetry';
export interface CredentialAssignment {
    nodeName: string;
    credentialName: string;
    credentialType: string;
    source?: 'user' | 'aiGateway';
}
export type SlotSource = 'user' | 'aiGateway' | 'none';
export type ReasonNotAiGateway = AiGatewayEligibilityReason | 'notAvailable';
export interface SlotOutcome {
    nodeName: string;
    credentialType: string;
    source: SlotSource;
    hadUserCredential: boolean;
    aiGatewayAvailable: boolean;
    reasonNotAiGateway?: ReasonNotAiGateway;
}
export interface AutoAssignResult {
    assignments: CredentialAssignment[];
    skippedHttpNodes: string[];
    outcomes: SlotOutcome[];
}
export type McpCredentialsAutoassignEventPayload = {
    user_id: string;
    tool_name: 'create_workflow_from_code' | 'update_workflow';
    node_type: string;
    credential_type: string;
    source: SlotSource;
    had_user_credential: boolean;
    ai_gateway_available: boolean;
    reason_not_ai_gateway?: ReasonNotAiGateway;
};
export declare function reconcileAiGatewayMarkers(nodes: INode[], nodeTypes: NodeTypes, aiGatewayConfig: AiGatewayConfigDto | undefined): void;
export declare function autoPopulateNodeCredentials(workflow: IWorkflowBase, user: User, nodeTypes: NodeTypes, credentialsService: CredentialsService, projectId: string, aiGatewayService?: AiGatewayService): Promise<AutoAssignResult>;
export declare function trackAutoassignOutcomes(telemetry: Telemetry, userId: string, toolName: 'create_workflow_from_code' | 'update_workflow', outcomes: SlotOutcome[], nodesByName?: Map<string, string>, workflowId?: string): void;
export declare function stripNullCredentialStubs(nodes: INode[]): void;
