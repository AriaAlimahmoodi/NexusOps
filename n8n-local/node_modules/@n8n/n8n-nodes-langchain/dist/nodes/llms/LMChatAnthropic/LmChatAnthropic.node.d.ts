import { type INodeType, type INodeTypeDescription, type ISupplyDataFunctions, type SupplyData } from 'n8n-workflow';
import { searchModels } from './methods/searchModels';
export declare class LmChatAnthropic implements INodeType {
    methods: {
        listSearch: {
            searchModels: typeof searchModels;
        };
    };
    description: INodeTypeDescription;
    supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData>;
}
