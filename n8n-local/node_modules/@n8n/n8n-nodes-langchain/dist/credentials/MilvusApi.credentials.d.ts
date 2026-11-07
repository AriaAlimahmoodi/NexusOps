import type { ICredentialTestRequest, ICredentialType, INodeProperties, IAuthenticateGeneric } from 'n8n-workflow';
export declare class MilvusApi implements ICredentialType {
    name: string;
    displayName: string;
    documentationUrl: string;
    properties: INodeProperties[];
    authenticate: IAuthenticateGeneric;
    test: ICredentialTestRequest;
}
