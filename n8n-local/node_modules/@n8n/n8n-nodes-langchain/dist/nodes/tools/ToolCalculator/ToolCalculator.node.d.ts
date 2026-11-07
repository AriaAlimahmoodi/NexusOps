import { type IExecuteFunctions, type INodeExecutionData, type INodeType, type INodeTypeDescription, type ISupplyDataFunctions, type SupplyData } from 'n8n-workflow';
export declare class ToolCalculator implements INodeType {
    description: INodeTypeDescription;
    supplyData(this: ISupplyDataFunctions): Promise<SupplyData>;
    execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
}
