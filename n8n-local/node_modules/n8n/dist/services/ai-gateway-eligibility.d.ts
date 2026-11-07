import type { AiGatewayConfigDto } from '@n8n/api-types';
import type { INode } from 'n8n-workflow';
export declare const HTTP_NODE_TYPES: ReadonlySet<string>;
export type AiGatewayEligibilityReason = 'nodeNotCovered' | 'credentialTypeNotCovered' | 'versionTooLow' | 'unsupportedAction' | 'hiddenPropertySet';
export type AiGatewayEligibility = {
    eligible: true;
} | {
    eligible: false;
    reason: AiGatewayEligibilityReason;
    details?: string;
};
export declare function checkAiGatewayEligibility(node: Pick<INode, 'type' | 'typeVersion' | 'parameters'>, credentialType: string, config: AiGatewayConfigDto, resolvedParameters?: Record<string, unknown>): AiGatewayEligibility;
