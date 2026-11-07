import type { BreakingChangeRuleMetadata, IBreakingChangeInstanceRule, InstanceDetectionReport } from '../../types';
export declare class DotenvUpgradeRule implements IBreakingChangeInstanceRule {
    id: string;
    getMetadata(): BreakingChangeRuleMetadata;
    private fileExists;
    detect(): Promise<InstanceDetectionReport>;
}
