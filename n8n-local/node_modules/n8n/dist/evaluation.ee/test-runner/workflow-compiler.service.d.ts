import type { EvaluationConfig } from '@n8n/db';
import type { IWorkflowBase } from 'n8n-workflow';
import { NodeTypes } from '../../node-types';
import { LlmJudgeProviderRegistry } from '../llm-judge-provider-registry';
export declare class WorkflowCompilerService {
    private readonly providerRegistry;
    private readonly nodeTypes;
    constructor(providerRegistry: LlmJudgeProviderRegistry, nodeTypes: NodeTypes);
    compile(workflow: IWorkflowBase, config: EvaluationConfig): IWorkflowBase;
    private findReplacedUpstreamNode;
    private computeMetricRowYs;
    private rewriteExpressionsOnNode;
    private prepareExistingEvaluationNodes;
    private pruneConnectionsTo;
    private assertNoReservedNames;
    private resolveEntryNode;
    private isTrigger;
    private findUserTriggerEdgeTo;
    private positionOf;
    private buildEvaluationTriggerNode;
    private buildMetricNode;
    private buildMetricNodeParameters;
    private metricParametersByType;
    private buildChatModelNodeIfNeeded;
    private resolveChatModelShape;
    private modelExpectsResourceLocator;
    private credentialsForProvider;
    private rewireConnections;
}
