export declare function renderOidcTestSuccess({ claims, userInfo, }: {
    claims: Record<string, unknown>;
    userInfo: Record<string, unknown>;
}, cspNonce: string): string;
export declare function renderOidcTestFailure(error: unknown, cspNonce: string): string;
