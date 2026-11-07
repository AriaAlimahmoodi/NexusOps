import type { WorkflowEntity, WorkflowHistory } from '@n8n/db';
import { dropInvalidWorkflowGroups, makeGetNodeTypeForGrouping, type IDataObject, type INodeCredentialsDetails, type INodeTypes, type IRun, type ITaskData, type IWorkflowBase, type IWorkflowSettings, type RelatedExecution, type GetNodeTypeForGrouping, type NodeGroupRuleOptions, type WorkflowStructureIssue } from 'n8n-workflow';
import { BadRequestError } from '@n8n/errors';
export { dropInvalidWorkflowGroups, makeGetNodeTypeForGrouping };
export { getLastExecutedNodeData, getLastExecutedNodeRuns } from 'n8n-workflow';
export declare function validatePinDataSize(workflow: IWorkflowBase): void;
export declare function addNodeIds(workflow: IWorkflowBase): void;
export declare function resolveNodeWebhookIds(workflow: IWorkflowBase, nodeTypes: INodeTypes): void;
export declare function validateWorkflowNodeGroups(workflow: Pick<IWorkflowBase, 'nodes' | 'nodeGroups'> & {
    connections?: IWorkflowBase['connections'];
}, getNodeType: GetNodeTypeForGrouping | null, rules?: NodeGroupRuleOptions): void;
export declare function sanitizeNodeGroupDescriptions(workflow: Pick<IWorkflowBase, 'nodeGroups'>): string[];
export declare class WorkflowStructureBadRequestError extends BadRequestError {
    readonly issues: WorkflowStructureIssue[];
    constructor(message: string, issues: WorkflowStructureIssue[]);
}
export declare function validateWorkflowStructure(workflow: Pick<IWorkflowBase, 'nodes' | 'connections'>): void;
export declare function removeDefaultValues(settings: IWorkflowSettings, defaultExecutionTimeout: number): IWorkflowSettings;
export type ReplaceInvalidCredentialsCache = Map<string, INodeCredentialsDetails>;
export declare function replaceInvalidCredentials<T extends IWorkflowBase>(workflow: T, projectId: string, cache?: ReplaceInvalidCredentialsCache): Promise<T>;
export declare function getVariables(workflowId?: string, projectId?: string): Promise<IDataObject>;
export declare function shouldRestartParentExecution(parentExecution: RelatedExecution | undefined): parentExecution is RelatedExecution;
export declare function updateParentExecutionWithChildResults(parentExecutionId: string, subworkflowResults: IRun, childExecution?: RelatedExecution, childWorkflowData?: IWorkflowBase): Promise<boolean>;
export declare function getActiveVersionUpdateValue(dbWorkflow: WorkflowEntity, updatedVersion: WorkflowHistory, updatedActive?: boolean): WorkflowHistory | null;
export declare function preserveInputOverride(runDataArray: ITaskData[]): void;
