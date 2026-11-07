import type { IDataObject, IExecuteFunctions, IHookFunctions, IHttpRequestMethods, ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
export interface ICustomInterface {
    name: string;
    key: string;
    field_type: string;
    options?: Array<{
        id: number;
        label: string;
    }>;
}
export interface ICustomProperties {
    [key: string]: ICustomInterface;
}
export interface IPipedriveApiOption {
    formData?: IDataObject;
    downloadFile?: boolean;
    apiVersion?: 'v1' | 'v2';
}
export declare function pipedriveApiRequest(this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions, method: IHttpRequestMethods, endpoint: string, body: IDataObject, query?: IDataObject, option?: IPipedriveApiOption): Promise<{
    additionalData: IDataObject;
    data: IDataObject[] | IDataObject;
}>;
export declare function pipedriveApiRequestAllItemsCursor(this: IHookFunctions | IExecuteFunctions, method: IHttpRequestMethods, endpoint: string, body: IDataObject, query?: IDataObject): Promise<{
    data: IDataObject[];
}>;
export declare function pipedriveApiRequestAllItemsOffset(this: IHookFunctions | IExecuteFunctions, method: IHttpRequestMethods, endpoint: string, body: IDataObject, query?: IDataObject): Promise<{
    data: IDataObject[];
}>;
export declare function pipedriveGetCustomProperties(this: IHookFunctions | IExecuteFunctions, resource: string): Promise<ICustomProperties>;
export declare function sortOptionParameters(optionParameters: INodePropertyOptions[]): INodePropertyOptions[];
//# sourceMappingURL=pipedrive.api.d.ts.map