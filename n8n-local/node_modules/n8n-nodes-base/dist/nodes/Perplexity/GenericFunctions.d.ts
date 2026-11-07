import type { IExecuteSingleFunctions, ILoadOptionsFunctions, IN8nHttpFullResponse, INodeExecutionData, INodeListSearchResult } from 'n8n-workflow';
export declare function sendErrorPostReceive(this: IExecuteSingleFunctions, data: INodeExecutionData[], response: IN8nHttpFullResponse): Promise<INodeExecutionData[]>;
export declare const agentErrorPostReceive: (this: IExecuteSingleFunctions, data: INodeExecutionData[], { statusCode, body, statusMessage }: IN8nHttpFullResponse) => Promise<INodeExecutionData[]>;
export declare const searchErrorPostReceive: (this: IExecuteSingleFunctions, data: INodeExecutionData[], { statusCode, body, statusMessage }: IN8nHttpFullResponse) => Promise<INodeExecutionData[]>;
export declare const embeddingsErrorPostReceive: (this: IExecuteSingleFunctions, data: INodeExecutionData[], { statusCode, body, statusMessage }: IN8nHttpFullResponse) => Promise<INodeExecutionData[]>;
export declare function getAgentModels(this: ILoadOptionsFunctions, filter?: string): Promise<INodeListSearchResult>;
//# sourceMappingURL=GenericFunctions.d.ts.map