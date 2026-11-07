import { CommunityPackageRequestDto } from '@n8n/api-types';
import type { AuthenticatedRequest } from '@n8n/db';
import type { NodeRequest } from '../../requests';
import { CommunityPackagesLifecycleService } from './community-packages.lifecycle.service';
export declare class CommunityPackagesController {
    private readonly communityPackagesLifecycle;
    constructor(communityPackagesLifecycle: CommunityPackagesLifecycleService);
    installPackage(req: AuthenticatedRequest, _res: unknown, body: CommunityPackageRequestDto): Promise<import("./installed-packages.entity").InstalledPackages>;
    getInstalledPackages(): Promise<import("./installed-packages.entity").InstalledPackages[] | import("n8n-workflow").PublicInstalledPackage[]>;
    uninstallPackage(req: NodeRequest.Delete): Promise<void>;
    updatePackage(req: AuthenticatedRequest, _res: unknown, body: CommunityPackageRequestDto): Promise<import("./installed-packages.entity").InstalledPackages>;
}
