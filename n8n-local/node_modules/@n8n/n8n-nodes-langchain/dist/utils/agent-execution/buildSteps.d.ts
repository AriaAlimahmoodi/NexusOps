import type { EngineResponse } from 'n8n-workflow';
import type { RequestResponseMetadata, ToolCallData } from './types';
export declare function buildSteps(response: EngineResponse<RequestResponseMetadata> | undefined, itemIndex: number): ToolCallData[];
