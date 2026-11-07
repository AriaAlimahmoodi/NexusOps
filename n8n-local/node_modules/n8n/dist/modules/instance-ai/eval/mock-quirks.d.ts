export interface MockQuirk {
    service: string;
    hostnames?: string[];
    endpoint?: string;
    guidance: string;
    rationale: string;
    addedAt: string;
}
export declare const MOCK_QUIRKS: MockQuirk[];
export declare function quirkMatches(quirk: MockQuirk, service: string, method: string, pathname: string, hostname?: string): boolean;
export declare function endpointMatchesPattern(pattern: string, method: string, pathname: string): boolean;
export declare function findMockQuirks(service: string, method: string, pathname: string, hostname?: string): string[];
export declare function hostnameMatchesPattern(pattern: string, hostname: string): boolean;
