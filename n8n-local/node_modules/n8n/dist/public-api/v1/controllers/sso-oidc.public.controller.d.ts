import { OidcConfigurationPublicDto, UpdateOidcConfigurationPublicDto } from '@n8n/api-types';
import { InstanceSettingsLoaderConfig } from '@n8n/config';
import type { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { OidcService } from '../../../modules/sso-oidc/oidc.service.ee';
export declare class SsoOidcPublicController {
    private readonly oidcService;
    private readonly instanceSettingsLoaderConfig;
    constructor(oidcService: OidcService, instanceSettingsLoaderConfig: InstanceSettingsLoaderConfig);
    getOidcConfiguration(): Promise<OidcConfigurationPublicDto>;
    setOidcConfiguration(_req: AuthenticatedRequest, _res: Response, body: UpdateOidcConfigurationPublicDto): Promise<OidcConfigurationPublicDto>;
}
