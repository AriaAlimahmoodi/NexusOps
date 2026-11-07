import type { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription, INodeTypeBaseDescription, ISupplyDataFunctions } from 'n8n-workflow';
export declare class AgentToolV2 implements INodeType {
    description: INodeTypeDescription;
    constructor(baseDescription: INodeTypeBaseDescription);
    execute(this: IExecuteFunctions | ISupplyDataFunctions): Promise<INodeExecutionData[][]>;
}
