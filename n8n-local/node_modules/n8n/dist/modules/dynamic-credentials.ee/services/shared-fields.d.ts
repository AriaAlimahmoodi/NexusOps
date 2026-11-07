import { type ICredentialDataDecryptedObject, type ICredentialType } from 'n8n-workflow';
export declare function extractSharedFields(credentialType: ICredentialType): string[];
export declare function getChangedSharedFields(credentialType: ICredentialType, oldData: ICredentialDataDecryptedObject, newData: ICredentialDataDecryptedObject): string[];
