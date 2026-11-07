export type CsrfStateRequired = {
    token: string;
    createdAt: number;
    data?: string;
};
export type CreateCsrfStateData = {
    cid: string;
    origin: 'static-credential' | 'dynamic-credential';
    resource?: string;
    bindingHash?: string;
    [key: string]: unknown;
};
export type CsrfState = CsrfStateRequired;
export declare const MAX_CSRF_AGE: number;
export declare const enum OauthVersion {
    V1 = 1,
    V2 = 2
}
export interface OAuth1CredentialData {
    signatureMethod: 'HMAC-SHA256' | 'HMAC-SHA512' | 'HMAC-SHA1';
    consumerKey: string;
    consumerSecret: string;
    authUrl: string;
    accessTokenUrl: string;
    requestTokenUrl: string;
}
export declare const algorithmMap: {
    readonly 'HMAC-SHA256': 'sha256';
    readonly 'HMAC-SHA512': 'sha512';
    readonly 'HMAC-SHA1': 'sha1';
};
