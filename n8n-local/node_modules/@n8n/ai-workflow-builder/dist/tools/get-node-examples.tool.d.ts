import type { Logger } from '@n8n/backend-common';
import { z } from 'zod';
export type NodeExampleType = 'configuration' | 'connections';
interface CreateNodeExamplesToolOptions {
    exampleType: NodeExampleType;
    logger?: Logger;
}
export declare function createGetNodeExamplesTool({ exampleType, logger }: CreateNodeExamplesToolOptions): {
    toolName: string;
    displayTitle: string;
    getCustomDisplayTitle?: (values: Record<string, unknown>) => string;
    tool: import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
        nodes: z.ZodArray<z.ZodObject<{
            nodeType: z.ZodString;
            nodeVersion: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            nodeType: string;
            nodeVersion?: number | undefined;
        }, {
            nodeType: string;
            nodeVersion?: number | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        nodes: {
            nodeType: string;
            nodeVersion?: number | undefined;
        }[];
    }, {
        nodes: {
            nodeType: string;
            nodeVersion?: number | undefined;
        }[];
    }>, {
        nodes: {
            nodeType: string;
            nodeVersion?: number | undefined;
        }[];
    }, {
        nodes: {
            nodeType: string;
            nodeVersion?: number | undefined;
        }[];
    }, import("@langchain/langgraph").Command<unknown, Record<string, unknown>, string>, unknown, string>;
};
export declare const createGetNodeConfigurationExamplesTool: (logger?: Logger) => {
    toolName: string;
    displayTitle: string;
    getCustomDisplayTitle?: (values: Record<string, unknown>) => string;
    tool: import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
        nodes: z.ZodArray<z.ZodObject<{
            nodeType: z.ZodString;
            nodeVersion: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            nodeType: string;
            nodeVersion?: number | undefined;
        }, {
            nodeType: string;
            nodeVersion?: number | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        nodes: {
            nodeType: string;
            nodeVersion?: number | undefined;
        }[];
    }, {
        nodes: {
            nodeType: string;
            nodeVersion?: number | undefined;
        }[];
    }>, {
        nodes: {
            nodeType: string;
            nodeVersion?: number | undefined;
        }[];
    }, {
        nodes: {
            nodeType: string;
            nodeVersion?: number | undefined;
        }[];
    }, import("@langchain/langgraph").Command<unknown, Record<string, unknown>, string>, unknown, string>;
};
export declare const createGetNodeConnectionExamplesTool: (logger?: Logger) => {
    toolName: string;
    displayTitle: string;
    getCustomDisplayTitle?: (values: Record<string, unknown>) => string;
    tool: import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
        nodes: z.ZodArray<z.ZodObject<{
            nodeType: z.ZodString;
            nodeVersion: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            nodeType: string;
            nodeVersion?: number | undefined;
        }, {
            nodeType: string;
            nodeVersion?: number | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        nodes: {
            nodeType: string;
            nodeVersion?: number | undefined;
        }[];
    }, {
        nodes: {
            nodeType: string;
            nodeVersion?: number | undefined;
        }[];
    }>, {
        nodes: {
            nodeType: string;
            nodeVersion?: number | undefined;
        }[];
    }, {
        nodes: {
            nodeType: string;
            nodeVersion?: number | undefined;
        }[];
    }, import("@langchain/langgraph").Command<unknown, Record<string, unknown>, string>, unknown, string>;
};
export {};
