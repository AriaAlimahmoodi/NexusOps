import { type ITriggerFunctions, type INodeType, type INodeTypeDescription, type ITriggerResponse } from 'n8n-workflow';
export declare class ManualChatTrigger implements INodeType {
    description: INodeTypeDescription;
    trigger(this: ITriggerFunctions): Promise<ITriggerResponse>;
}
