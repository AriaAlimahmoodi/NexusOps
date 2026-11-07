import { Logger } from '@n8n/backend-common';
import { InstanceSettingsLoaderConfig } from '@n8n/config';
import { WorkflowRepository } from '@n8n/db';
import { CommunityNodeTypesService } from '../../modules/community-packages/community-node-types.service';
import { CommunityPackagesConfig } from '../../modules/community-packages/community-packages.config';
import { CommunityPackagesService } from '../../modules/community-packages/community-packages.service';
export declare class CommunityPackagesInstanceSettingsLoader {
    private readonly config;
    private readonly communityPackagesConfig;
    private readonly communityPackagesService;
    private readonly communityNodeTypesService;
    private readonly workflowRepository;
    private logger;
    constructor(config: InstanceSettingsLoaderConfig, communityPackagesConfig: CommunityPackagesConfig, communityPackagesService: CommunityPackagesService, communityNodeTypesService: CommunityNodeTypesService, workflowRepository: WorkflowRepository, logger: Logger);
    run(): Promise<'created' | 'skipped'>;
    private findWorkflowsReferencingPackage;
    private buildReconciliationPlan;
    private resolveVersionAndChecksum;
    private parseAndValidate;
}
