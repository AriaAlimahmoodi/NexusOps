import type { User } from '@n8n/db';
import z from 'zod';
import type { InstanceContextService } from '../../../modules/instance-ai/instance-context.service';
import type { Telemetry } from '../../../telemetry';
import type { ToolDefinition } from '../mcp.types';
export declare const GET_INSTANCE_CONTEXT_TOOL_NAME = "get_instance_context";
export declare const INSTANCE_CONTEXT_RESOURCE_URI = "n8n://instance/context";
export declare const EMPTY_INSTANCE_CONTEXT_TEXT = "Nothing has been built on this instance yet.";
export declare const NOTHING_EXPOSED_TEXT: string;
declare const inputSchema: {
    projectId: z.ZodOptional<z.ZodString>;
};
export type InstanceContextRead = {
    kind: 'context';
    text: string;
} | {
    kind: 'empty';
} | {
    kind: 'withheld';
};
export declare function readInstanceContext(user: User, instanceContext: InstanceContextService, options: {
    executionGranted: boolean;
}, projectId?: string): Promise<InstanceContextRead>;
export declare function instanceContextText(read: InstanceContextRead): string;
export declare const createGetInstanceContextTool: (user: User, instanceContext: InstanceContextService, telemetry: Telemetry, options: {
    executionGranted: boolean;
}) => ToolDefinition<typeof inputSchema>;
export declare const INSTANCE_CONTEXT_RESOURCE_DESCRIPTION: string;
export {};
