import { type IExecuteFunctions, type INodeExecutionData, type INodeType, type INodeTypeDescription, type ISupplyDataFunctions, type SupplyData } from 'n8n-workflow';
import { getTools } from './loadOptions';
export declare class McpClientTool implements INodeType {
    description: INodeTypeDescription;
    methods: {
        loadOptions: {
            getTools: typeof getTools;
        };
    };
    supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData>;
    execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
}
