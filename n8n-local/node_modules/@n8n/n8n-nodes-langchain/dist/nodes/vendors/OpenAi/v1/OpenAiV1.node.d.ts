import { type IExecuteFunctions, type INodeType, type INodeTypeBaseDescription, type INodeTypeDescription } from 'n8n-workflow';
import { listSearch, loadOptions } from '../methods';
export declare class OpenAiV1 implements INodeType {
    description: INodeTypeDescription;
    constructor(baseDescription: INodeTypeBaseDescription);
    methods: {
        listSearch: typeof listSearch;
        loadOptions: typeof loadOptions;
    };
    execute(this: IExecuteFunctions): Promise<import("n8n-workflow").INodeExecutionData[][]>;
}
