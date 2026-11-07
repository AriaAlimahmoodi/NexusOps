import type { Logger } from '@n8n/backend-common';
import type { User } from '@n8n/db';
import z from 'zod';
import type { AiPreferenceService } from '../../../services/ai-preference.service';
import type { Telemetry } from '../../../telemetry';
import type { ToolDefinition } from '../mcp.types';
declare const inputSchema: {
    id: z.ZodString;
};
export declare const createUndoUserPreferenceTool: (user: User, aiPreferenceService: AiPreferenceService, telemetry: Telemetry, logger: Logger) => ToolDefinition<typeof inputSchema>;
export {};
