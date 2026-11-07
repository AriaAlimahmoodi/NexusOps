import { JsonStore } from '@n8n/blob-storage';
import { ErrorReporter, FsByteStoreService } from 'n8n-core';
import type { ExecutionDataPayload, ExecutionRef } from './types';
export declare class ExecutionDataJsonStore extends JsonStore<ExecutionRef, ExecutionDataPayload> {
    constructor(fsByteStore: FsByteStoreService, errorReporter: ErrorReporter);
}
