import { CommunityPackageListPublicDto, CommunityPackagePublicDto, InstallCommunityPackagePublicDto, ListCommunityPackagesQueryDto, UpdateCommunityPackagePublicDto } from '@n8n/api-types';
import type { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { CommunityPackagesLifecycleService } from '../../../modules/community-packages/community-packages.lifecycle.service';
export declare class CommunityPackagesPublicController {
    private readonly communityPackagesLifecycleService;
    constructor(communityPackagesLifecycleService: CommunityPackagesLifecycleService);
    getInstalledPackages(_req: AuthenticatedRequest, _res: Response, _query: ListCommunityPackagesQueryDto): Promise<CommunityPackageListPublicDto>;
    installPackage(req: AuthenticatedRequest, _res: Response, body: InstallCommunityPackagePublicDto): Promise<CommunityPackagePublicDto>;
    updatePackage(req: AuthenticatedRequest, _res: Response, name: string, body: UpdateCommunityPackagePublicDto): Promise<CommunityPackagePublicDto>;
    uninstallPackage(req: AuthenticatedRequest, _res: Response, packageName: string): Promise<void>;
}
