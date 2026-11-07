import type { User } from '@n8n/db';
import z from 'zod';
import type { InstanceContextService } from '../../../modules/instance-ai/instance-context.service';
import type { Telemetry } from '../../../telemetry';
import type { ToolDefinition } from '../mcp.types';
export declare const GET_INSTANCE_ACTIVITY_TOOL_NAME = "get_instance_activity";
export declare const EXPAND_INSTANCE_ACTIVITY_TOOL_NAME = "expand_instance_activity";
declare const listInputSchema: {
    category: z.ZodOptional<z.ZodEnum<["workflow", "credential"]>>;
    resourceId: z.ZodOptional<z.ZodString>;
    beforeId: z.ZodOptional<z.ZodNumber>;
    projectId: z.ZodOptional<z.ZodString>;
    limit: z.ZodOptional<z.ZodNumber>;
};
declare const expandInputSchema: {
    id: z.ZodNumber;
    projectId: z.ZodOptional<z.ZodString>;
};
export declare const createGetInstanceActivityTool: (user: User, instanceContext: InstanceContextService, telemetry: Telemetry, options: {
    credentialGranted: boolean;
    executionGranted: boolean;
}) => ToolDefinition<typeof listInputSchema>;
export declare const createExpandInstanceActivityTool: (user: User, instanceContext: InstanceContextService, telemetry: Telemetry, options: {
    credentialGranted: boolean;
    executionGranted: boolean;
}) => ToolDefinition<typeof expandInputSchema>;
export {};
