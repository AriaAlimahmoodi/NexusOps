import { Readable } from 'node:stream';
import type { PackageWriter } from '../package-writer';
export declare class TarPackageWriter implements PackageWriter {
    private readonly entries;
    private manifest;
    writeFile(path: string, content: string | Buffer): void;
    writeDirectory(path: string): void;
    finalize(): Readable;
}
