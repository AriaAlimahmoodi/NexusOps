export declare function adminConsentRedirectUri(instanceBaseUrl: string, scope: {
    projectId: string;
    agentId: string;
}): string | undefined;
export declare function adminConsentUrl(tenantId: string, clientId: string, redirectUri: string): string;
