import { ExecutionsConfig } from '@n8n/config';
import { BinaryDataConfig } from 'n8n-core';
import type { BreakingChangeRuleMetadata, IBreakingChangeInstanceRule, InstanceDetectionReport } from '../../types';
export declare class BinaryDataStorageRule implements IBreakingChangeInstanceRule {
    private readonly config;
    private readonly executionsConfig;
    constructor(config: BinaryDataConfig, executionsConfig: ExecutionsConfig);
    id: string;
    getMetadata(): BreakingChangeRuleMetadata;
    detect(): Promise<InstanceDetectionReport>;
}
