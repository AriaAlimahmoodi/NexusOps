import type { ExecutionDataStorageLocation } from '@n8n/db';
export type ExecutionDataEventMap = {
    'execution-data-read': {
        mode: ExecutionDataStorageLocation;
        durationMs: number;
        success: boolean;
        unreadableBundles: number;
    };
    'execution-data-write': {
        mode: ExecutionDataStorageLocation;
        workflowId: string;
        durationMs: number;
        success: boolean;
        jsonSizeBytes: number;
    };
};
