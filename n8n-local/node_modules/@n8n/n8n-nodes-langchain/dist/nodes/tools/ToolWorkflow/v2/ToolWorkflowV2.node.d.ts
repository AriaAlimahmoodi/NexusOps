import type { INodeTypeBaseDescription, ISupplyDataFunctions, SupplyData, INodeType, INodeTypeDescription, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { localResourceMapping } from './methods';
export declare class ToolWorkflowV2 implements INodeType {
    description: INodeTypeDescription;
    constructor(baseDescription: INodeTypeBaseDescription);
    methods: {
        localResourceMapping: typeof localResourceMapping;
    };
    supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData>;
    execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
}
