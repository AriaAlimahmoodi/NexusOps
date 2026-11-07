import type { Logger } from '@n8n/backend-common';
import type { INodeTypeDescription } from 'n8n-workflow';
import { z } from 'zod';
import type { BuilderToolBase } from '../utils/stream-processor';
export declare const NODE_DETAILS_TOOL: BuilderToolBase;
export declare function createNodeDetailsTool(nodeTypes: INodeTypeDescription[], logger?: Logger): {
    toolName: string;
    displayTitle: string;
    getCustomDisplayTitle?: (values: Record<string, unknown>) => string;
    tool: import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
        nodeName: z.ZodString;
        nodeVersion: z.ZodNumber;
        withParameters: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        withConnections: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, "strip", z.ZodTypeAny, {
        nodeName: string;
        nodeVersion: number;
        withParameters: boolean;
        withConnections: boolean;
    }, {
        nodeName: string;
        nodeVersion: number;
        withParameters?: boolean | undefined;
        withConnections?: boolean | undefined;
    }>, {
        nodeName: string;
        nodeVersion: number;
        withParameters: boolean;
        withConnections: boolean;
    }, {
        nodeName: string;
        nodeVersion: number;
        withParameters?: boolean | undefined;
        withConnections?: boolean | undefined;
    }, import("@langchain/langgraph").Command<unknown, Record<string, unknown>, string>, unknown, string>;
};
