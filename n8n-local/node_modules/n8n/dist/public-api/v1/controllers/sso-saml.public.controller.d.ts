import { SamlConfigurationPublicDto, UpdateSamlConfigurationPublicDto } from '@n8n/api-types';
import { InstanceSettingsLoaderConfig } from '@n8n/config';
import type { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { SamlService } from '../../../modules/sso-saml/saml.service.ee';
export declare class SamlSsoPublicController {
    private readonly samlService;
    private readonly instanceSettingsLoaderConfig;
    constructor(samlService: SamlService, instanceSettingsLoaderConfig: InstanceSettingsLoaderConfig);
    getSamlConfiguration(): SamlConfigurationPublicDto;
    updateSamlConfiguration(_req: AuthenticatedRequest, _res: Response, body: UpdateSamlConfigurationPublicDto): Promise<SamlConfigurationPublicDto>;
}
