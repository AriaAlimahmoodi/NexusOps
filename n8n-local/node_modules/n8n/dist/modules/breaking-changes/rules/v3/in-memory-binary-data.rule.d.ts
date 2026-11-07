import { BinaryDataConfig } from 'n8n-core';
import type { BreakingChangeRuleMetadata, IBreakingChangeInstanceRule, InstanceDetectionReport } from '../../types';
export declare class InMemoryBinaryDataRule implements IBreakingChangeInstanceRule {
    private readonly binaryDataConfig;
    constructor(binaryDataConfig: BinaryDataConfig);
    id: string;
    getMetadata(): BreakingChangeRuleMetadata;
    detect(): Promise<InstanceDetectionReport>;
}
