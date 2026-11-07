import { ExecutionsConfig } from '@n8n/config';
import type { IPinData, IWorkflowBase, WorkflowExecuteMode, WorkflowExecutionSource } from 'n8n-workflow';
import { Workflow } from 'n8n-workflow';
import { ExternalHooks } from '../../external-hooks';
import { NodeTypes } from '../../node-types';
import { WorkflowHookContextService } from '../../workflow-hook-context.service';
export declare class WorkflowPreExecute {
    private readonly externalHooks;
    private readonly workflowContext;
    private readonly nodeTypes;
    private readonly executionsConfig;
    constructor(externalHooks: ExternalHooks, workflowContext: WorkflowHookContextService, nodeTypes: NodeTypes, executionsConfig: ExecutionsConfig);
    run(workflowData: IWorkflowBase, mode: WorkflowExecuteMode, source?: WorkflowExecutionSource, pinData?: IPinData): Promise<Workflow | undefined>;
    private writeHookMutations;
    private nodesFromWorkflow;
}
