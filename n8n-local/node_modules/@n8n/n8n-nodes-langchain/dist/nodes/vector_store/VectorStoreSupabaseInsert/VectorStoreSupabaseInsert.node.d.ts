import { type IExecuteFunctions, type INodeType, type INodeTypeDescription, type INodeExecutionData } from 'n8n-workflow';
import { supabaseTableNameSearch } from '../shared/methods/listSearch';
export declare class VectorStoreSupabaseInsert implements INodeType {
    description: INodeTypeDescription;
    methods: {
        listSearch: {
            supabaseTableNameSearch: typeof supabaseTableNameSearch;
        };
    };
    execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
}
