import { GlobalConfig } from '@n8n/config';
import type { BreakingChangeRuleMetadata, IBreakingChangeInstanceRule, InstanceDetectionReport } from '../../types';
export declare class SettingsFilePermissionsRule implements IBreakingChangeInstanceRule {
    private readonly globalConfig;
    constructor(globalConfig: GlobalConfig);
    id: string;
    getMetadata(): BreakingChangeRuleMetadata;
    detect(): Promise<InstanceDetectionReport>;
}
