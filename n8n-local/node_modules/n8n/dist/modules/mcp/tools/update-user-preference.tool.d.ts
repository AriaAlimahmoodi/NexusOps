import type { Logger } from '@n8n/backend-common';
import type { User } from '@n8n/db';
import z from 'zod';
import type { AiPreferenceService } from '../../../services/ai-preference.service';
import type { UrlService } from '@n8n/backend-services';
import type { Telemetry } from '../../../telemetry';
import type { ToolDefinition } from '../mcp.types';
declare const inputSchema: {
    id: z.ZodString;
    content: z.ZodOptional<z.ZodString>;
    scope: z.ZodOptional<z.ZodEnum<["user", "project", "instance"]>>;
    projectId: z.ZodOptional<z.ZodString>;
};
export declare const createUpdateUserPreferenceTool: (user: User, aiPreferenceService: AiPreferenceService, telemetry: Telemetry, urlService: UrlService, logger: Logger) => ToolDefinition<typeof inputSchema>;
export {};
