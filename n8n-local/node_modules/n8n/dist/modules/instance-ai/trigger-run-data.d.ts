import type { INode, INodeExecutionData, IPinData, IRunExecutionData } from 'n8n-workflow';
interface TriggerExecutionDataInput {
    triggerNode: INode;
    pinData?: IPinData;
    triggerItems?: INodeExecutionData[];
}
export declare function createTriggerExecutionData(input: TriggerExecutionDataInput): IRunExecutionData;
export {};
