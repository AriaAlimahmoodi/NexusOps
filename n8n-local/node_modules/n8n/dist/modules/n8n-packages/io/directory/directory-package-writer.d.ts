import type { PackageWriter } from '../package-writer';
export declare class DirectoryPackageWriter implements PackageWriter {
    private readonly targetDir;
    constructor(targetDir: string);
    writeFile(entryPath: string, content: string | Buffer): Promise<void>;
    writeDirectory(entryPath: string): Promise<void>;
    finalize(): Promise<void>;
    private resolveWithin;
}
