import { type IExecuteFunctions, type INodeType, type INodeTypeDescription, type INodeExecutionData } from 'n8n-workflow';
export declare class VectorStoreZepInsert implements INodeType {
    description: INodeTypeDescription;
    execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
}
