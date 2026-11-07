import type { INodeType, INodeTypeDescription, ISupplyDataFunctions, SupplyData, ILoadOptionsFunctions } from 'n8n-workflow';
export declare class LmOpenAi implements INodeType {
    description: INodeTypeDescription;
    methods: {
        listSearch: {
            openAiModelSearch(this: ILoadOptionsFunctions): Promise<{
                results: {
                    name: string;
                    value: string;
                }[];
            }>;
        };
    };
    supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData>;
}
