import type { PromotionChanges, PromotionChangesQueryDto, PromotionDirection } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { VariablesRepository, WorkflowRepository, type User } from '@n8n/db';
import { N8nPackagesService } from '../../modules/n8n-packages/n8n-packages.service';
import { type PackageManifest } from '../../modules/n8n-packages/spec/manifest.schema';
import { PromotionsService } from './promotions.service';
export declare class PromotionChangeService {
    private readonly promotionsService;
    private readonly packagesService;
    private readonly workflowRepository;
    private readonly variablesRepository;
    private readonly logger;
    constructor(promotionsService: PromotionsService, packagesService: N8nPackagesService, workflowRepository: WorkflowRepository, variablesRepository: VariablesRepository, logger: Logger);
    getChanges(user: User, projectId: string, direction: PromotionDirection, query: PromotionChangesQueryDto): Promise<PromotionChanges>;
    private assertCanPreview;
    private diffPackages;
    private exportInstancePackage;
    private readBranchDesired;
}
export declare function scopeManifestToProject(manifest: PackageManifest, projectId: string): PackageManifest;
