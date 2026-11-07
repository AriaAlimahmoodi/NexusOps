export declare class HostnameMatcher {
    private readonly parsed;
    constructor(patterns: readonly string[]);
    matches(hostname: string): boolean;
    private normalizeHostname;
}
