import { Logger } from '@n8n/backend-common';
import type { ICredentialContext, ICredentialDataDecryptedObject, IDataObject, IExecutionContext, IWorkflowSettings } from 'n8n-workflow';
import type { CredentialResolutionResult, CredentialResolveMetadata, ICredentialResolutionProvider } from './credential-resolution-provider.interface';
import type { CredentialStoreMetadata, IDynamicCredentialStorageProvider } from './dynamic-credential-storage.interface';
export declare class DynamicCredentialsProxy implements IDynamicCredentialStorageProvider, ICredentialResolutionProvider {
    private readonly logger;
    private storageProvider;
    private resolvingProvider;
    constructor(logger: Logger);
    setStorageProvider(provider: IDynamicCredentialStorageProvider): void;
    setResolverProvider(provider: ICredentialResolutionProvider): void;
    getSystemResolverId(): string | null;
    getEffectiveResolverId(settings: Pick<IWorkflowSettings, 'credentialResolverId'> | undefined): string | null;
    resolveIfNeeded(credentialsResolveMetadata: CredentialResolveMetadata, staticData: ICredentialDataDecryptedObject, executionContext?: IExecutionContext, workflowSettings?: IWorkflowSettings, executionId?: string): Promise<CredentialResolutionResult>;
    storeIfNeeded(credentialStoreMetadata: CredentialStoreMetadata, dynamicData: ICredentialDataDecryptedObject, credentialContext: ICredentialContext, staticData?: ICredentialDataDecryptedObject, workflowSettings?: IWorkflowSettings, executionId?: string): Promise<void>;
    storeOAuthTokenDataIfNeeded(credentialStoreMetadata: CredentialStoreMetadata, oauthTokenData: IDataObject, executionContext: IExecutionContext | undefined, staticData: ICredentialDataDecryptedObject, workflowSettings?: IWorkflowSettings, executionId?: string): Promise<void>;
}
