import { Logger } from '@n8n/backend-common';
import { InstanceSettingsLoaderConfig } from '@n8n/config';
import { MfaService } from '../../mfa/mfa.service';
import { SecuritySettingsService } from '../../services/security-settings.service';
export declare class SecurityPolicyInstanceSettingsLoader {
    private readonly instanceSettingsLoaderConfig;
    private readonly securitySettingsService;
    private readonly mfaService;
    private logger;
    constructor(instanceSettingsLoaderConfig: InstanceSettingsLoaderConfig, securitySettingsService: SecuritySettingsService, mfaService: MfaService, logger: Logger);
    run(): Promise<'created' | 'skipped'>;
}
