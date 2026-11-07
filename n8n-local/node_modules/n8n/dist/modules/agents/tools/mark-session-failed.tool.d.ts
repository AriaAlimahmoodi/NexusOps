import { Tool } from '@n8n/agents/tool';
import { z } from 'zod';
export declare const MARK_SESSION_FAILED_TOOL_NAME = "mark_session_failed";
export declare function createMarkSessionFailedTool(): Tool<z.ZodObject<{
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
}, {
    reason: string;
}>, z.ZodTypeAny, undefined, undefined>;
