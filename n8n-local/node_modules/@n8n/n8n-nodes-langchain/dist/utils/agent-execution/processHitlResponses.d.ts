import type { EngineResponse, EngineRequest } from 'n8n-workflow';
import type { RequestResponseMetadata } from './types';
export interface HitlProcessingResult {
    pendingGatedToolRequest?: EngineRequest<RequestResponseMetadata>;
    processedResponse: EngineResponse<RequestResponseMetadata>;
    hasApprovedHitlTools: boolean;
}
export declare function processHitlResponses(response: EngineResponse<RequestResponseMetadata> | undefined, itemIndex: number): HitlProcessingResult;
