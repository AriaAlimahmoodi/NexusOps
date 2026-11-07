import type { ProjectPoolSettingsResponse, UpdateProjectPoolSettingsDto } from '@n8n/api-types';
import { LicenseState } from '@n8n/backend-common';
import { GlobalConfig } from '@n8n/config';
import { ProjectPoolSettingsRepository } from '@n8n/db';
import type { IWorkflowExecutionDataProcess } from 'n8n-workflow';
import { CacheService } from '@n8n/backend-services';
import { WorkerPoolsService } from './worker-pools.service.ee';
export declare class PoolConfigService {
    private readonly projectPoolSettingsRepository;
    private readonly cacheService;
    private readonly workerPoolsService;
    private readonly globalConfig;
    private readonly licenseState;
    constructor(projectPoolSettingsRepository: ProjectPoolSettingsRepository, cacheService: CacheService, workerPoolsService: WorkerPoolsService, globalConfig: GlobalConfig, licenseState: LicenseState);
    resolvePoolForExecution(data: Pick<IWorkflowExecutionDataProcess, 'projectId'>): Promise<{
        queueName: string;
        poolName: string | undefined;
    }>;
    getProjectPoolSettings(projectId: string): Promise<ProjectPoolSettingsResponse>;
    setProjectPoolSettings(projectId: string, patch: UpdateProjectPoolSettingsDto): Promise<ProjectPoolSettingsResponse>;
    private cacheKey;
    private getProjectDefaultPool;
}
