import type { EngineResponse } from 'n8n-workflow';
import type { RequestResponseMetadata } from './types';
export declare function buildResponseMetadata(response: EngineResponse<RequestResponseMetadata> | undefined, itemIndex: number): RequestResponseMetadata;
