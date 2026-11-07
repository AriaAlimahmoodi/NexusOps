import type { ConsentUiHints } from '@n8n/api-types';
import { LicenseState } from '@n8n/backend-common';
import { UrlService } from '@n8n/backend-services';
import { GlobalConfig } from '@n8n/config';
import type { ProtectedResource, ResourceUser } from '@n8n/inbound-auth';
export declare class PublicApiProtectedResource implements ProtectedResource {
    private readonly urlService;
    private readonly globalConfig;
    private readonly licenseState;
    readonly id = "public-api";
    readonly surface: 'public-api';
    readonly displayName = "n8n public API";
    readonly uiHints: ConsentUiHints;
    readonly scopes: string[];
    constructor(urlService: UrlService, globalConfig: GlobalConfig, licenseState: LicenseState);
    getResourceUrl(): string;
    getAudiences(): string[];
    isAvailable(): Promise<boolean>;
    authorize(): Promise<boolean>;
    getGrantableScopes(user: ResourceUser): Promise<string[]>;
}
