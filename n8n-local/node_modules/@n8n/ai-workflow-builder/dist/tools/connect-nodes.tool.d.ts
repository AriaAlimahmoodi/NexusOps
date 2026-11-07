import type { Logger } from '@n8n/backend-common';
import { type INodeTypeDescription } from 'n8n-workflow';
import { z } from 'zod';
import type { BuilderTool, BuilderToolBase } from '../utils/stream-processor';
export declare const nodeConnectionSchema: z.ZodObject<{
    sourceNodeId: z.ZodString;
    targetNodeId: z.ZodString;
    sourceOutputIndex: z.ZodOptional<z.ZodNumber>;
    targetInputIndex: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    sourceNodeId: string;
    targetNodeId: string;
    sourceOutputIndex?: number | undefined;
    targetInputIndex?: number | undefined;
}, {
    sourceNodeId: string;
    targetNodeId: string;
    sourceOutputIndex?: number | undefined;
    targetInputIndex?: number | undefined;
}>;
export declare const CONNECT_NODES_TOOL: BuilderToolBase;
export declare function createConnectNodesTool(nodeTypes: INodeTypeDescription[], logger?: Logger): BuilderTool;
