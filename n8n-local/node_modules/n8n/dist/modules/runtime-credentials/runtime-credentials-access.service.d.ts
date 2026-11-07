import { Cipher } from 'n8n-core';
import type { IDataObject, IRunExecutionData } from 'n8n-workflow';
import { RuntimeCredentialProvider } from '@n8n/backend-services';
export declare class RuntimeCredentialsAccessService implements RuntimeCredentialProvider {
    private readonly cipher;
    constructor(cipher: Cipher);
    getRuntimeCredential(runExecutionData: IRunExecutionData, alias: string): Promise<IDataObject[string] | undefined>;
}
