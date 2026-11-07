import type { User } from '@n8n/db';
import z from 'zod';
import type { NodeTypes } from '../../../../node-types';
import type { Telemetry } from '../../../../telemetry';
import type { ToolDefinition } from '../../mcp.types';
declare const inputSchema: {
    code: z.ZodString;
};
export declare const createValidateWorkflowCodeTool: (user: User, telemetry: Telemetry, nodeTypes: NodeTypes) => ToolDefinition<typeof inputSchema>;
export {};
