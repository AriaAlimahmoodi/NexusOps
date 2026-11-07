export interface SemVer {
    major: number;
    minor: number;
    patch: number;
}
export interface VersionEntry extends SemVer {
    createdAt: Date;
}
export declare function formatVersion(v: SemVer): string;
export declare function parseVersion(versionString: string): SemVer;
export declare function compareVersions(a: SemVer, b: SemVer): -1 | 0 | 1;
export declare function versionGte(a: SemVer, b: SemVer): boolean;
