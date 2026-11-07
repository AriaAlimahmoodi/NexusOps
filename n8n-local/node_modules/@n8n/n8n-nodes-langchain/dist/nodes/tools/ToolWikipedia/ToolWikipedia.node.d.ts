import { type IExecuteFunctions, type INodeType, type INodeTypeDescription, type ISupplyDataFunctions, type SupplyData, type INodeExecutionData } from 'n8n-workflow';
export declare class ToolWikipedia implements INodeType {
    description: INodeTypeDescription;
    supplyData(this: ISupplyDataFunctions): Promise<SupplyData>;
    execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
}
