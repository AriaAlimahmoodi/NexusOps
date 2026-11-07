import type { WorkflowMetadata } from '../types';
export declare function appendArrayReducer<T>(current: T[], update: T[] | undefined | null): T[];
export declare function cachedTemplatesReducer(current: WorkflowMetadata[], update: WorkflowMetadata[] | undefined | null): WorkflowMetadata[];
