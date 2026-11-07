import { type INodeExecutionData, type IExecuteFunctions, type INodeType, type INodeTypeDescription, type ITriggerFunctions, type ITriggerResponse } from 'n8n-workflow';
export declare class ExecuteWorkflowTrigger implements INodeType {
    description: INodeTypeDescription;
    trigger(this: ITriggerFunctions): Promise<ITriggerResponse>;
    execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
}
//# sourceMappingURL=ExecuteWorkflowTrigger.node.d.ts.map