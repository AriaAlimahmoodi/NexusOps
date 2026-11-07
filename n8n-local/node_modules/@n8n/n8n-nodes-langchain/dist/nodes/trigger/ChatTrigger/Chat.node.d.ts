import { sendAndWaitWebhook } from 'n8n-nodes-base/dist/utils/sendAndWait/utils';
import type { IExecuteFunctions, INodeExecutionData, INodeTypeDescription, INodeType } from 'n8n-workflow';
export declare class Chat implements INodeType {
    description: INodeTypeDescription;
    webhook: typeof sendAndWaitWebhook;
    onMessage(context: IExecuteFunctions, data: INodeExecutionData): Promise<INodeExecutionData[][]>;
    execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
}
