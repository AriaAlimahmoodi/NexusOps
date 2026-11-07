export declare class OAuthHelpers {
    static buildSuccessRedirectUrl(redirectUri: string, code: string, state: string | null, issuer: string): string;
    static buildErrorRedirectUrl(redirectUri: string, error: string, errorDescription: string, state: string | null, issuer: string): string;
    static setIssuerParam(url: string, issuer: string): string;
    static basicAuthClientId(header?: string): string | undefined;
}
