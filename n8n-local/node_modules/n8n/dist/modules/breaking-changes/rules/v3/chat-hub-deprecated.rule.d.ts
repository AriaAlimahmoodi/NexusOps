import { SettingsRepository } from '@n8n/db';
import type { BreakingChangeRuleMetadata, IBreakingChangeInstanceRule, InstanceDetectionReport } from '../../types';
export declare class ChatHubDeprecatedRule implements IBreakingChangeInstanceRule {
    private readonly settingsRepository;
    constructor(settingsRepository: SettingsRepository);
    id: string;
    getMetadata(): BreakingChangeRuleMetadata;
    detect(): Promise<InstanceDetectionReport>;
}
