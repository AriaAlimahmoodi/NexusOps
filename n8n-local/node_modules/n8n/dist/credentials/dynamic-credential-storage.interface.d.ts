import type { ICredentialContext, ICredentialDataDecryptedObject, IWorkflowSettings } from 'n8n-workflow';
export type CredentialStoreMetadata = {
    id: string;
    name: string;
    type: string;
    resolverId?: string;
    isResolvable: boolean;
};
export interface IDynamicCredentialStorageProvider {
    storeIfNeeded(credentialStoreMetadata: CredentialStoreMetadata, dynamicData: ICredentialDataDecryptedObject, credentialContext: ICredentialContext, staticData?: ICredentialDataDecryptedObject, workflowSettings?: IWorkflowSettings, executionId?: string): Promise<void>;
}
