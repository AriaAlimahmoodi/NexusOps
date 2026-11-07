import type { PackageManifest } from '../../spec/manifest.schema';
import type { PackageReader } from '../package-reader';
export interface TarReaderLimits {
    maxUncompressedBytes: number;
    maxEntryBytes: number;
    maxEntries: number;
    maxPathLength: number;
}
export declare class TarPackageReader implements PackageReader {
    private readonly buffer;
    private readonly limits;
    private entries;
    constructor(buffer: Buffer, limits: TarReaderLimits);
    readManifest(): Promise<PackageManifest>;
    readFile(entryPath: string): Promise<Buffer>;
    listEntries(): Promise<string[]>;
    private load;
    private validateEntryPath;
    private parse;
}
