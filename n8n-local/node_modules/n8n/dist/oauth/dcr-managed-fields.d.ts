import type { OAuth2CredentialData } from '@n8n/client-oauth2';
export declare const DCR_MANAGED_CREDENTIAL_FIELDS: readonly ['authUrl', 'accessTokenUrl', 'grantType', 'authentication', 'usePkce', 'clientId', 'clientSecret'];
export type DcrManagedCredentialField = (typeof DCR_MANAGED_CREDENTIAL_FIELDS)[number];
export declare const OAUTH_PINNED_FIELDS: readonly ['useDynamicClientRegistration', 'authUrl', 'accessTokenUrl', 'grantType', 'authentication', 'usePkce', 'requestTokenUrl', 'signatureMethod'];
export type DcrManagedCredentialValues = {
    [Field in DcrManagedCredentialField]: OAuth2CredentialData[Field] | undefined;
};
