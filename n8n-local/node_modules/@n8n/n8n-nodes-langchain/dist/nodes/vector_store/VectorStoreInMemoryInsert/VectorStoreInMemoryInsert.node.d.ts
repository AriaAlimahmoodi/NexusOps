import { type INodeExecutionData, type IExecuteFunctions, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
export declare class VectorStoreInMemoryInsert implements INodeType {
    description: INodeTypeDescription;
    execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
}
