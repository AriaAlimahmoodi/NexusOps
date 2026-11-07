import type { PackageManifest } from '../../spec/manifest.schema';
import type { PackageReader } from '../package-reader';
export interface DirectoryReaderLimits {
    maxUncompressedBytes: number;
    maxEntryBytes: number;
    maxEntries: number;
    maxPathLength: number;
}
export declare class DirectoryPackageReader implements PackageReader {
    private readonly baseDir;
    private readonly limits;
    constructor(baseDir: string, limits: DirectoryReaderLimits);
    readManifest(): Promise<PackageManifest>;
    readFile(entryPath: string): Promise<Buffer>;
    listEntries(): Promise<string[]>;
    private readWithinBase;
    private lstatWithoutSymlinks;
    private validateEntryPath;
    private resolveWithin;
    private walk;
}
