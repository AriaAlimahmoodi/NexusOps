import { type ISupplyDataFunctions, type INodeType, type INodeTypeDescription, type SupplyData } from 'n8n-workflow';
export declare class MemoryZep implements INodeType {
    description: INodeTypeDescription;
    supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData>;
}
