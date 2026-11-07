import type { ICredentialTestRequest, ICredentialType, INodeProperties, IHttpRequestOptions, ICredentialDataDecryptedObject } from 'n8n-workflow';
export type LemonadeApiCredentialsType = {
    baseUrl: string;
    apiKey?: string;
};
export declare class LemonadeApi implements ICredentialType {
    name: string;
    displayName: string;
    documentationUrl: string;
    properties: INodeProperties[];
    authenticate(credentials: ICredentialDataDecryptedObject, requestOptions: IHttpRequestOptions): Promise<IHttpRequestOptions>;
    test: ICredentialTestRequest;
}
