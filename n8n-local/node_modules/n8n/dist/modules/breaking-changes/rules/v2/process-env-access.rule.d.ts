import { BreakingChangeRecommendation } from '@n8n/api-types';
import { WorkflowEntity } from '@n8n/db';
import { INode } from 'n8n-workflow';
import type { BreakingChangeRuleMetadata, IBreakingChangeWorkflowRule, WorkflowDetectionReport } from '../../types';
export declare class ProcessEnvAccessRule implements IBreakingChangeWorkflowRule {
    id: string;
    getMetadata(): BreakingChangeRuleMetadata;
    detectWorkflow(workflow: WorkflowEntity, _nodesGroupedByType: Map<string, INode[]>): Promise<WorkflowDetectionReport>;
    getRecommendations(): Promise<BreakingChangeRecommendation[]>;
}
