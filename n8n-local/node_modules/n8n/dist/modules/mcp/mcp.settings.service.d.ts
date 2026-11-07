import { Logger } from '@n8n/backend-common';
import { GlobalConfig } from '@n8n/config';
import { SettingsRepository, WorkflowRepository, type User, type EntityManager } from '@n8n/db';
import { type IWorkflowSettings } from 'n8n-workflow';
import { CollaborationService } from '../../collaboration/collaboration.service';
import { CacheService } from '@n8n/backend-services';
import { WorkflowFinderService } from '../../workflows/workflow-finder.service';
import type { UpdateWorkflowsAvailabilityDto } from './dto/update-workflows-availability.dto';
type BulkSetAvailableInMCPResult = {
    updatedCount: number;
    unchangedCount: number;
    skippedCount: number;
    failedCount: number;
    changedWorkflows: WorkflowMCPAvailabilityChange[];
    updatedIds?: string[];
    unchangedIds?: string[];
};
type WorkflowMCPAvailabilityChange = {
    workflowId: string;
    settings: Pick<IWorkflowSettings, 'availableInMCP'>;
    checksum?: string;
};
export declare class McpSettingsService {
    private readonly settingsRepository;
    private readonly cacheService;
    private readonly workflowRepository;
    private readonly workflowFinderService;
    private readonly globalConfig;
    private readonly logger;
    private readonly collaborationService;
    constructor(settingsRepository: SettingsRepository, cacheService: CacheService, workflowRepository: WorkflowRepository, workflowFinderService: WorkflowFinderService, globalConfig: GlobalConfig, logger: Logger, collaborationService: CollaborationService);
    getEnabled(em?: EntityManager): Promise<boolean>;
    setEnabled(enabled: boolean): Promise<void>;
    getAllowedRedirectUris(): Promise<string[]>;
    setAllowedRedirectUris(uris: string[]): Promise<void>;
    getAutoExposeNewWorkflows(em?: EntityManager): Promise<boolean>;
    setAutoExposeNewWorkflows(enabled: boolean): Promise<void>;
    bulkSetAvailableInMCP(user: User, dto: UpdateWorkflowsAvailabilityDto): Promise<BulkSetAvailableInMCPResult>;
    broadcastWorkflowMCPAvailabilityChanged(changes: WorkflowMCPAvailabilityChange[]): Promise<void>;
    private resolveCandidateIds;
}
export {};
