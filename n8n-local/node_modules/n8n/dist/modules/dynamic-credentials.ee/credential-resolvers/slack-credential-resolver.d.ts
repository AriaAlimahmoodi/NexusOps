import { Logger } from '@n8n/backend-common';
import { type CredentialResolverConfiguration, type CredentialResolverHandle, type ICredentialResolver } from '@n8n/decorators';
import { Cipher } from 'n8n-core';
import { type ICredentialContext, type ICredentialDataDecryptedObject } from 'n8n-workflow';
import { SlackSignatureIdentifier } from './identifiers/slack-signature-identifier';
import { DynamicCredentialEntryStorage } from './storage/dynamic-credential-entry-storage';
export declare class SlackCredentialResolver implements ICredentialResolver {
    private readonly logger;
    private readonly slackSignatureIdentifier;
    private readonly storage;
    private readonly cipher;
    constructor(logger: Logger, slackSignatureIdentifier: SlackSignatureIdentifier, storage: DynamicCredentialEntryStorage, cipher: Cipher);
    metadata: {
        name: string;
        description: string;
        displayName: string;
        options: ({
            displayName: string;
            name: string;
            type: 'string';
            typeOptions: {
                password: boolean;
            };
            required: boolean;
            default: string;
            description: string;
            options?: undefined;
        } | {
            typeOptions?: undefined;
            required?: undefined;
            displayName: string;
            name: string;
            type: 'options';
            options: {
                name: string;
                value: string;
                description: string;
            }[];
            default: string;
            description: string;
        })[];
    };
    getSecret(credentialId: string, context: ICredentialContext, handle: CredentialResolverHandle): Promise<ICredentialDataDecryptedObject>;
    setSecret(credentialId: string, context: ICredentialContext, data: ICredentialDataDecryptedObject, handle: CredentialResolverHandle): Promise<void>;
    deleteSecret(credentialId: string, context: ICredentialContext, handle: CredentialResolverHandle): Promise<void>;
    deleteAllSecrets(handle: CredentialResolverHandle): Promise<void>;
    validateOptions(options: CredentialResolverConfiguration): Promise<void>;
    validateIdentity(context: ICredentialContext, handle: CredentialResolverHandle): Promise<void>;
    private parseOptions;
}
