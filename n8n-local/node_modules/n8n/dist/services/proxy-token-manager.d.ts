export declare class ProxyTokenManager {
    private readonly fetchToken;
    private readonly refreshThreshold;
    private cached;
    private refreshPromise;
    constructor(fetchToken: () => Promise<{
        accessToken: string;
        tokenType: string;
    }>, refreshThreshold?: number);
    getAuthHeaders(): Promise<Record<string, string>>;
    private getValidToken;
    private isExpiringSoon;
    private refresh;
    private doRefresh;
}
