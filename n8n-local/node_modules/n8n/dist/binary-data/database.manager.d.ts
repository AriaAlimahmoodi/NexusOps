import { BinaryDataRepository } from '@n8n/db';
import { BinaryDataConfig, type BinaryData } from 'n8n-core';
import { Readable } from 'node:stream';
export declare class DatabaseManager implements BinaryData.Manager {
    private readonly repository;
    private readonly config;
    constructor(repository: BinaryDataRepository, config: BinaryDataConfig);
    init(): Promise<void>;
    store(location: BinaryData.FileLocation, bufferOrStream: Buffer | Readable, metadata: BinaryData.PreWriteMetadata): Promise<{
        fileId: string;
        fileSize: number;
    }>;
    getPath(fileId: string): string;
    getAsBuffer(fileId: string): Promise<Buffer<ArrayBufferLike>>;
    getAsStream(fileId: string): Promise<Readable>;
    getMetadata(fileId: string): Promise<BinaryData.Metadata>;
    deleteMany(locations: BinaryData.FileLocation[]): Promise<void>;
    deleteManyByFileId(ids: string[]): Promise<void>;
    copyByFileId(targetLocation: BinaryData.FileLocation, sourceFileId: string): Promise<string>;
    copyByFilePath(targetLocation: BinaryData.FileLocation, sourcePath: string, metadata: BinaryData.PreWriteMetadata): Promise<{
        fileId: string;
        fileSize: number;
    }>;
    rename(oldFileId: string, newFileId: string): Promise<void>;
    private toSource;
}
