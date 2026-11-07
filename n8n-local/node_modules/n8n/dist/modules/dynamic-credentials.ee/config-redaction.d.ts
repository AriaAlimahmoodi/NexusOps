import type { CredentialResolverConfiguration } from '@n8n/decorators';
import type { INodeProperties } from 'n8n-workflow';
export declare const collectSecretFieldNames: (options: INodeProperties[] | undefined) => Set<string>;
export declare const redactSecretConfig: (config: CredentialResolverConfiguration | undefined, secretNames: Set<string>) => CredentialResolverConfiguration;
export declare const restoreSecretConfig: (incoming: CredentialResolverConfiguration, stored: CredentialResolverConfiguration, secretNames: Set<string>) => CredentialResolverConfiguration;
