import type FormData from 'form-data';
import type { IDataObject, IExecuteFunctions, IHttpRequestMethods, ILoadOptionsFunctions } from 'n8n-workflow';
type RequestParameters = {
    headers?: IDataObject;
    body?: IDataObject | string | FormData;
    qs?: IDataObject;
    option?: IDataObject;
    enableAnthropicBetas?: {
        promptTools?: boolean;
        codeExecution?: boolean;
    };
};
export declare function apiRequest(this: IExecuteFunctions | ILoadOptionsFunctions, method: IHttpRequestMethods, endpoint: string, parameters?: RequestParameters): Promise<any>;
export {};
