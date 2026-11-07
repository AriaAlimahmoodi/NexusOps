import type { User } from '@n8n/db';
import z from 'zod';
import type { AiPreferenceService } from '../../../services/ai-preference.service';
import type { Telemetry } from '../../../telemetry';
import type { ToolDefinition } from '../mcp.types';
declare const inputSchema: {
    projectId: z.ZodOptional<z.ZodString>;
};
export declare const createGetUserPreferencesTool: (user: User, aiPreferenceService: AiPreferenceService, telemetry: Telemetry) => ToolDefinition<typeof inputSchema>;
export {};
