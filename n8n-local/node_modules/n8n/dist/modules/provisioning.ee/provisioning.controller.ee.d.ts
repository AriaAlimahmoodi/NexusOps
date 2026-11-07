import { LicenseState } from '@n8n/backend-common';
import { InstanceSettingsLoaderConfig } from '@n8n/config';
import { AuthenticatedRequest } from '@n8n/db';
import { Response } from 'express';
import { ProvisioningService } from './provisioning.service.ee';
export declare class ProvisioningController {
    private readonly provisioningService;
    private readonly licenseState;
    private readonly instanceSettingsLoaderConfig;
    constructor(provisioningService: ProvisioningService, licenseState: LicenseState, instanceSettingsLoaderConfig: InstanceSettingsLoaderConfig);
    getConfig(_req: AuthenticatedRequest, res: Response): Promise<import("@n8n/api-types").ProvisioningConfigDto | Response<any, Record<string, any>>>;
    patchConfig(req: AuthenticatedRequest, res: Response): Promise<import("@n8n/api-types").ProvisioningConfigDto | Response<any, Record<string, any>>>;
}
