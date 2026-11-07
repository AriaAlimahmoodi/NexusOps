import { type ReadStream } from 'node:fs';
export type GarbageCollectionResult = {
    success: boolean;
    message: string;
};
export type HeapSnapshotResult = {
    success: true;
    filePath: string;
    sizeBytes: number;
    sizeMB: number;
} | {
    success: false;
    message: string;
};
export declare class HeapDiagnosticsService {
    private readonly snapshotPaths;
    collectGarbage(): GarbageCollectionResult;
    writeHeapSnapshot(): HeapSnapshotResult;
    openHeapSnapshot(requestedFilename: string): ReadStream;
}
