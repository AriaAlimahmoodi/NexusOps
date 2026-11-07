import type { IDataObject, IExecuteFunctions, IHttpRequestMethods, ILoadOptionsFunctions } from 'n8n-workflow';
type RequestParameters = {
    headers?: IDataObject;
    body?: IDataObject | string;
    qs?: IDataObject;
    uri?: string;
    option?: IDataObject;
};
export declare function apiRequest(this: IExecuteFunctions | ILoadOptionsFunctions, method: IHttpRequestMethods, endpoint: string, parameters?: RequestParameters): Promise<any>;
export {};
