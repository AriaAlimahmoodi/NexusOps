import { ModuleRegistry, Logger } from '@n8n/backend-common';
import { EventService } from '@n8n/backend-services';
import { InstanceSettingsLoaderConfig } from '@n8n/config';
import { type AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import type { ListQuery } from '../../requests';
import { WorkflowService } from '../../workflows/workflow.service';
import { UpdateAllowedRedirectUrisDto } from './dto/update-allowed-redirect-uris.dto';
import { UpdateMcpSettingsDto } from './dto/update-mcp-settings.dto';
import { UpdateWorkflowsAvailabilityDto } from './dto/update-workflows-availability.dto';
import { McpServerApiKeyService } from './mcp-api-key.service';
import { McpSettingsService } from './mcp.settings.service';
export declare class McpSettingsController {
    private readonly mcpSettingsService;
    private readonly logger;
    private readonly moduleRegistry;
    private readonly mcpServerApiKeyService;
    private readonly workflowService;
    private readonly instanceSettingsLoaderConfig;
    private readonly eventService;
    constructor(mcpSettingsService: McpSettingsService, logger: Logger, moduleRegistry: ModuleRegistry, mcpServerApiKeyService: McpServerApiKeyService, workflowService: WorkflowService, instanceSettingsLoaderConfig: InstanceSettingsLoaderConfig, eventService: EventService);
    updateSettings(req: AuthenticatedRequest, _res: Response, dto: UpdateMcpSettingsDto): Promise<{
        mcpAccessEnabled: boolean;
        autoExposeNewWorkflows: boolean;
    }>;
    getApiKeyForMcpServer(req: AuthenticatedRequest): Promise<import("@n8n/db").ApiKey>;
    rotateApiKeyForMcpServer(req: AuthenticatedRequest): Promise<import("@n8n/db").ApiKey>;
    getAllowedRedirectUris(): Promise<{
        uris: string[];
    }>;
    updateAllowedRedirectUris(_req: AuthenticatedRequest, _res: Response, dto: UpdateAllowedRedirectUrisDto): Promise<{
        success: boolean;
    }>;
    getMcpEligibleWorkflows(req: ListQuery.Request, res: Response): Promise<void>;
    toggleWorkflowsMCPAccess(req: AuthenticatedRequest, _res: Response, dto: UpdateWorkflowsAvailabilityDto): Promise<{
        updatedCount: number;
        unchangedCount: number;
        skippedCount: number;
        failedCount: number;
        updatedIds?: string[];
        unchangedIds?: string[];
    }>;
    private refreshMcpModuleSettings;
}
