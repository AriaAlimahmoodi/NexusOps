import { type INodeType, type INodeTypeDescription, type ISupplyDataFunctions, type SupplyData } from 'n8n-workflow';
export declare class DocumentJsonInputLoader implements INodeType {
    description: INodeTypeDescription;
    supplyData(this: ISupplyDataFunctions): Promise<SupplyData>;
}
