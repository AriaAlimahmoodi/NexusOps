import { type IExecuteFunctions, type INodeType, type INodeTypeDescription, type INodeExecutionData } from 'n8n-workflow';
import { pineconeIndexSearch } from '../shared/methods/listSearch';
export declare class VectorStorePineconeInsert implements INodeType {
    description: INodeTypeDescription;
    methods: {
        listSearch: {
            pineconeIndexSearch: typeof pineconeIndexSearch;
        };
    };
    execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
}
