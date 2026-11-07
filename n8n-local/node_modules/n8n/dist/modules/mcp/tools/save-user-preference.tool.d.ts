import type { Logger } from '@n8n/backend-common';
import type { User } from '@n8n/db';
import z from 'zod';
import type { AiPreferenceService } from '../../../services/ai-preference.service';
import type { UrlService } from '@n8n/backend-services';
import type { Telemetry } from '../../../telemetry';
import type { ToolDefinition, ToolHandlerResult } from '../mcp.types';
declare const inputSchema: {
    content: z.ZodString;
};
export declare const createSaveUserPreferenceTool: (user: User, aiPreferenceService: AiPreferenceService, telemetry: Telemetry, urlService: UrlService, logger: Logger) => ToolDefinition<typeof inputSchema, ToolHandlerResult>;
export {};
