import type { Logger } from '@n8n/backend-common';
import { z } from 'zod';
import type { BuilderTool, BuilderToolBase } from '../utils/stream-processor';
export declare const renameNodeSchema: z.ZodObject<{
    nodeId: z.ZodString;
    newName: z.ZodString;
}, "strip", z.ZodTypeAny, {
    nodeId: string;
    newName: string;
}, {
    nodeId: string;
    newName: string;
}>;
export declare const RENAME_NODE_TOOL: BuilderToolBase;
export declare function createRenameNodeTool(logger?: Logger): BuilderTool;
