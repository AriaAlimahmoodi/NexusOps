import type { CustomFetch } from '@n8n/backend-network';
import type { ICredentialDataDecryptedObject } from 'n8n-workflow';
export type AuthFetchDomainPolicy = {
    mode: 'domains';
    domains: string;
} | {
    mode: 'none';
};
export declare function getBearerTokenRevision(headers: Record<string, string>, expiresAtValue?: unknown): {
    accessToken?: string;
    expiresAt?: number;
};
interface CreateAuthFetchOptions {
    baseFetch: CustomFetch;
    initialHeaders: Record<string, string>;
    onUnauthorized?: (currentHeaders: Record<string, string>) => Promise<Record<string, string> | null>;
    shouldRefresh?: () => boolean;
    allowedDomains?: AuthFetchDomainPolicy;
}
export declare function resolveAllowedDomains(credentialData: ICredentialDataDecryptedObject): AuthFetchDomainPolicy | undefined;
export declare function createAuthFetch({ baseFetch, initialHeaders, onUnauthorized, shouldRefresh, allowedDomains, }: CreateAuthFetchOptions): typeof fetch;
export {};
