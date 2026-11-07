import type { LicenseState } from '@n8n/backend-common';
import type { ProjectRepository, User } from '@n8n/db';
import z from 'zod';
import type { Telemetry } from '../../../telemetry';
import type { ToolDefinition } from '../mcp.types';
declare const inputSchema: {
    query: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<["personal", "team"]>>;
    limit: z.ZodOptional<z.ZodNumber>;
};
export declare const createSearchProjectsTool: (user: User, projectRepository: ProjectRepository, licenseState: LicenseState, telemetry: Telemetry) => ToolDefinition<typeof inputSchema>;
export {};
