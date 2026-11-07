import type { BreakingChangeAffectedWorkflow, BreakingChangeRecommendation } from '@n8n/api-types';
import type { WorkflowEntity } from '@n8n/db';
import type { INode } from 'n8n-workflow';
import type { BatchWorkflowDetectionReport, BreakingChangeRuleMetadata, IBreakingChangeBatchWorkflowRule } from '../../types';
export declare class WaitNodeSubworkflowRule implements IBreakingChangeBatchWorkflowRule {
    id: string;
    private subWorkflowsWithWaitingNodes;
    private parentWorkflowsCalling;
    private readonly waitingNodeConfig;
    getMetadata(): BreakingChangeRuleMetadata;
    getRecommendations(_workflowResults: BreakingChangeAffectedWorkflow[]): Promise<BreakingChangeRecommendation[]>;
    reset(): void;
    collectWorkflowData(workflow: WorkflowEntity, nodesGroupedByType: Map<string, INode[]>): Promise<void>;
    produceReport(): Promise<BatchWorkflowDetectionReport>;
    private findWaitingNodes;
    protected extractCalledWorkflowId(node: INode, callerWorkflowId: string): string | undefined;
    private isWorkflowItselfExpression;
}
