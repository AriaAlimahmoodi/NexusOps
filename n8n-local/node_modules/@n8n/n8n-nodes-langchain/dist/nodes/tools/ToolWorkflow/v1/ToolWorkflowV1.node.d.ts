import type { INodeType, INodeTypeDescription, ISupplyDataFunctions, SupplyData, INodeTypeBaseDescription } from 'n8n-workflow';
export declare class ToolWorkflowV1 implements INodeType {
    description: INodeTypeDescription;
    constructor(baseDescription: INodeTypeBaseDescription);
    supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData>;
}
