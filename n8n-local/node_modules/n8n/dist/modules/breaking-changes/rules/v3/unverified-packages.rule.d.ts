import type { BreakingChangeRuleMetadata, IBreakingChangeInstanceRule, InstanceDetectionReport } from '../../types';
export declare class CommunityPackagesEnabledConfig {
    enabled: boolean;
    private disabledModules;
    sanitize(): void;
}
export declare class UnverifiedPackagesRule implements IBreakingChangeInstanceRule {
    private readonly communityPackagesConfig;
    constructor(communityPackagesConfig: CommunityPackagesEnabledConfig);
    id: string;
    getMetadata(): BreakingChangeRuleMetadata;
    detect(): Promise<InstanceDetectionReport>;
}
