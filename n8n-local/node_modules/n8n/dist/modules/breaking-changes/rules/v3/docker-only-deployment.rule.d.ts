import { InstanceSettings } from 'n8n-core';
import type { BreakingChangeRuleMetadata, IBreakingChangeInstanceRule, InstanceDetectionReport } from '../../types';
export declare class DockerOnlyDeploymentRule implements IBreakingChangeInstanceRule {
    private readonly instanceSettings;
    constructor(instanceSettings: InstanceSettings);
    id: string;
    getMetadata(): BreakingChangeRuleMetadata;
    detect(): Promise<InstanceDetectionReport>;
}
