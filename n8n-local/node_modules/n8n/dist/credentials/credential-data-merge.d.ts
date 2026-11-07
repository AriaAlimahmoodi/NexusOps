import type { ICredentialDataDecryptedObject, IDataObject } from 'n8n-workflow';
export type CredentialArrayMergeMode = 'merge-by-index' | 'keep-existing';
export declare function mergeCredentialData({ existing, incoming, arrays, }: {
    existing: ICredentialDataDecryptedObject;
    incoming: IDataObject;
    arrays: CredentialArrayMergeMode;
}): ICredentialDataDecryptedObject;
