import type { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription, NodeExecutionWithMetadata } from 'n8n-workflow';
import * as listSearch from './listSearch';
import * as resourceMapping from './resourceMapping';
export declare class McpClient implements INodeType {
    description: INodeTypeDescription;
    methods: {
        listSearch: typeof listSearch;
        resourceMapping: typeof resourceMapping;
    };
    execute(this: IExecuteFunctions): Promise<INodeExecutionData[][] | NodeExecutionWithMetadata[][] | null>;
}
