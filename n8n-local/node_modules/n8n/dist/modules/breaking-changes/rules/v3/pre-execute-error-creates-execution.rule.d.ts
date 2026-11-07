import { ExecutionsConfig } from '@n8n/config';
import type { BreakingChangeRuleMetadata, IBreakingChangeInstanceRule, InstanceDetectionReport } from '../../types';
export declare class PreExecuteErrorCreatesExecutionRule implements IBreakingChangeInstanceRule {
    private readonly executionsConfig;
    constructor(executionsConfig: ExecutionsConfig);
    id: string;
    getMetadata(): BreakingChangeRuleMetadata;
    detect(): Promise<InstanceDetectionReport>;
}
