import { type ByteStore, type PreWriteBlobMetadata, type StorageLocation } from '@n8n/blob-storage';
import { BinaryDataRepository, type ExecutionDataStorageLocation } from '@n8n/db';
import { ErrorReporter, FsByteStoreService, StorageConfig } from 'n8n-core';
import type { Readable } from 'node:stream';
export type StoredAgentKnowledgeFile = {
    storedAt: ExecutionDataStorageLocation;
    storageKey: string;
};
export declare class AgentKnowledgeFileStore {
    private readonly storageConfig;
    private readonly binaryDataRepository;
    private readonly errorReporter;
    private readonly byteStores;
    constructor(fsByteStore: FsByteStoreService, storageConfig: StorageConfig, binaryDataRepository: BinaryDataRepository, errorReporter: ErrorReporter);
    registerByteStore(loc: StorageLocation, store: ByteStore): void;
    write(ref: {
        agentId: string;
        fileId: string;
    }, body: Buffer | Readable, metadata: PreWriteBlobMetadata): Promise<StoredAgentKnowledgeFile>;
    readAsBuffer(file: StoredAgentKnowledgeFile): Promise<Buffer | null>;
    delete(files: StoredAgentKnowledgeFile[]): Promise<void>;
    private keysToDelete;
    private newKeyFor;
}
