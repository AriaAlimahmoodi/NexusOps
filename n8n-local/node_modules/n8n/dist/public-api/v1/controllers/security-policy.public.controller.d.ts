import { SecurityPolicyPublicDto, UpdateSecurityPolicyDto } from '@n8n/api-types';
import { InstanceSettingsLoaderConfig } from '@n8n/config';
import type { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { SecuritySettingsService } from '../../../services/security-settings.service';
export declare class SecurityPolicyPublicController {
    private readonly securitySettingsService;
    private readonly instanceSettingsLoaderConfig;
    constructor(securitySettingsService: SecuritySettingsService, instanceSettingsLoaderConfig: InstanceSettingsLoaderConfig);
    getSecurityPolicy(): Promise<SecurityPolicyPublicDto>;
    updateSecurityPolicy(req: AuthenticatedRequest, _res: Response, body: UpdateSecurityPolicyDto): Promise<SecurityPolicyPublicDto>;
}
