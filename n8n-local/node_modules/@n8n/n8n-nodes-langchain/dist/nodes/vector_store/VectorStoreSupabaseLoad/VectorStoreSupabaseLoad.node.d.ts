import { type INodeType, type INodeTypeDescription, type ISupplyDataFunctions, type SupplyData } from 'n8n-workflow';
import { supabaseTableNameSearch } from '../shared/methods/listSearch';
export declare class VectorStoreSupabaseLoad implements INodeType {
    description: INodeTypeDescription;
    methods: {
        listSearch: {
            supabaseTableNameSearch: typeof supabaseTableNameSearch;
        };
    };
    supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData>;
}
