import { LicenseState } from '@n8n/backend-common';
import { SettingsRepository } from '@n8n/db';
import type { BreakingChangeRuleMetadata, IBreakingChangeInstanceRule, InstanceDetectionReport } from '../../types';
export declare class ExternalSecretsProjectRolesDefaultRule implements IBreakingChangeInstanceRule {
    private readonly licenseState;
    private readonly settingsRepository;
    constructor(licenseState: LicenseState, settingsRepository: SettingsRepository);
    id: string;
    getMetadata(): BreakingChangeRuleMetadata;
    detect(): Promise<InstanceDetectionReport>;
    private isSystemRolesEnabled;
}
