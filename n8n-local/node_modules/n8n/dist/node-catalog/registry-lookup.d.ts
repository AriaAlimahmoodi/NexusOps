export interface RegistryEntryFields {
    name: string;
    displayName?: string;
}
export interface RegistryCandidate extends RegistryEntryFields {
    numberOfDownloads?: number;
    packageName: string;
}
export declare const registryQueryTerms: (query: string) => string[];
export declare function matchesRegistryQuery(entry: RegistryEntryFields, terms: string[]): boolean;
export declare function rankRegistryMatches<T extends RegistryCandidate>(query: string, matches: T[]): T[];
export declare function findRegistryMatches<T extends RegistryCandidate>(query: string, candidates: T[]): T[];
