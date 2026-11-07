import type { Logger } from '@n8n/backend-common';
import type { BuilderTool, BuilderToolBase } from '../utils/stream-processor';
export interface GetNodeContextOutput {
    found: boolean;
    nodeName: string;
    nodeType?: string;
    parentCount: number;
    childCount: number;
    hasExecutionData: boolean;
    message: string;
}
export declare const GET_NODE_CONTEXT_TOOL: BuilderToolBase;
export declare function createGetNodeContextTool(logger?: Logger): BuilderTool;
