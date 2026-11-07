import type { INodeCredentials, INodeListSearchResult, INodeParameters, INodeTypeNameVersion } from 'n8n-workflow';
export type ResourceLocatorCallback = (methodName: string, path: string, nodeTypeAndVersion: INodeTypeNameVersion, currentNodeParameters: INodeParameters, credentials?: INodeCredentials, filter?: string, paginationToken?: string) => Promise<INodeListSearchResult>;
export type ResourceLocatorCallbackFactory = (userId: string) => ResourceLocatorCallback;
