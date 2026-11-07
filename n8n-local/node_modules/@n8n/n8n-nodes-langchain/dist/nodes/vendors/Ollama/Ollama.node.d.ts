import type { IExecuteFunctions, INodeType } from 'n8n-workflow';
import { listSearch } from './methods';
export declare class Ollama implements INodeType {
    description: import("n8n-workflow").INodeTypeDescription;
    methods: {
        listSearch: typeof listSearch;
    };
    execute(this: IExecuteFunctions): Promise<import("n8n-workflow").INodeExecutionData[][]>;
}
