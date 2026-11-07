import { type INodeType, type INodeTypeDescription, type ISupplyDataFunctions, type SupplyData } from 'n8n-workflow';
import { pineconeIndexSearch } from '../shared/methods/listSearch';
export declare class VectorStorePineconeLoad implements INodeType {
    description: INodeTypeDescription;
    methods: {
        listSearch: {
            pineconeIndexSearch: typeof pineconeIndexSearch;
        };
    };
    supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData>;
}
