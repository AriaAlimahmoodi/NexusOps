import * as fflate from 'fflate';
export interface CompressionOptions {
    level?: fflate.ZipOptions['level'];
    exclude?: string[];
    includeHidden?: boolean;
}
export interface DecompressionOptions {
    overwrite?: boolean;
    exclude?: string[];
}
export declare function compressFolder(sourceDir: string, outputPath: string, options?: CompressionOptions): Promise<void>;
export declare function decompressFolder(sourcePath: string, outputDir: string): Promise<void>;
