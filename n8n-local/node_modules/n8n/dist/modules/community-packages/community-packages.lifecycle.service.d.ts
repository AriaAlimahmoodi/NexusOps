import { Logger } from '@n8n/backend-common';
import { EventService } from '@n8n/backend-services';
import { InstanceSettingsLoaderConfig } from '@n8n/config';
import { InstanceSettings } from 'n8n-core';
import { type PublicInstalledPackage } from 'n8n-workflow';
import type { UserLike } from '../../events/maps/relay.event-map';
import { Push } from '../../push';
import { CommunityNodeTypesService } from './community-node-types.service';
import { CommunityPackagesConfig } from './community-packages.config';
import { CommunityPackagesService } from './community-packages.service';
import type { InstalledPackages } from './installed-packages.entity';
export type CommunityPackageInstallPresentation = 'ui' | 'publicApi' | 'mcp';
export type MissingInstalledPackageBehavior = 'badRequest' | 'notFound';
export declare class CommunityPackagesLifecycleService {
    private readonly logger;
    private readonly push;
    private readonly communityPackagesService;
    private readonly eventService;
    private readonly communityNodeTypesService;
    private readonly instanceSettings;
    private readonly communityPackagesConfig;
    private readonly instanceSettingsLoaderConfig;
    constructor(logger: Logger, push: Push, communityPackagesService: CommunityPackagesService, eventService: EventService, communityNodeTypesService: CommunityNodeTypesService, instanceSettings: InstanceSettings, communityPackagesConfig: CommunityPackagesConfig, instanceSettingsLoaderConfig: InstanceSettingsLoaderConfig);
    private assertNotManagedByEnv;
    private resolveVetted;
    listInstalledPackages(): Promise<PublicInstalledPackage[] | InstalledPackages[]>;
    install(args: {
        name: string | undefined;
        version?: string;
    }, user: UserLike, presentation: CommunityPackageInstallPresentation): Promise<InstalledPackages>;
    update(args: {
        name: string | undefined;
        version?: string;
    }, user: UserLike, whenMissing: MissingInstalledPackageBehavior): Promise<InstalledPackages>;
    uninstall(packageName: string | undefined, user: UserLike, whenMissing: MissingInstalledPackageBehavior): Promise<void>;
}
