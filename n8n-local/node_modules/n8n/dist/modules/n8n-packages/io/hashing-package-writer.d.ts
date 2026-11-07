import type { PackageWriter } from './package-writer';
export declare class HashingPackageWriter implements PackageWriter {
    private readonly hashes;
    writeFile(path: string, content: string | Buffer): void;
    writeDirectory(_path: string): void;
    finalize(): Array<{
        path: string;
        blobSha: string;
    }>;
}
