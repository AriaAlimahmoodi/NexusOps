import { type ResolvedNodeParametersResult } from '@n8n/instance-ai';
import type { NodeTypes } from '../../node-types';
export declare function extractResolvedNodeParameters(nodeTypes: NodeTypes, executionId: string, nodeName: string, options?: {
    itemIndex?: number;
    runIndex?: number;
}): Promise<ResolvedNodeParametersResult>;
