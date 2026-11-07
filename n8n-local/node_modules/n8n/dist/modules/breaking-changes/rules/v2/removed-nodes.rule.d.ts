import type { BreakingChangeAffectedWorkflow, BreakingChangeRecommendation } from '@n8n/api-types';
import type { WorkflowEntity } from '@n8n/db';
import type { INode } from 'n8n-workflow';
import type { BreakingChangeRuleMetadata, IBreakingChangeWorkflowRule, WorkflowDetectionReport } from '../../types';
export declare class RemovedNodesRule implements IBreakingChangeWorkflowRule {
    private readonly REMOVED_NODES;
    id: string;
    getMetadata(): BreakingChangeRuleMetadata;
    getRecommendations(_workflowResults: BreakingChangeAffectedWorkflow[]): Promise<BreakingChangeRecommendation[]>;
    detectWorkflow(_workflow: WorkflowEntity, nodesGroupedByType: Map<string, INode[]>): Promise<WorkflowDetectionReport>;
}
