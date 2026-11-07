import { type INodeType, type INodeTypeDescription, type ISupplyDataFunctions, type SupplyData, type ILoadOptionsFunctions } from 'n8n-workflow';
export declare class ModelSelector implements INodeType {
    description: INodeTypeDescription;
    methods: {
        loadOptions: {
            getModels(this: ILoadOptionsFunctions): Promise<{
                value: number;
                name: string;
            }[]>;
        };
    };
    supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData>;
}
