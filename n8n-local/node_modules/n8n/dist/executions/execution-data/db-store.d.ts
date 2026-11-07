import { ExecutionDataRepository } from '@n8n/db';
import type { EntityManager } from '@n8n/db';
import type { ExecutionRef, ExecutionDataPayload, BundleWorkflowSnapshot } from './types';
export declare class DbStore {
    private readonly repository;
    constructor(repository: ExecutionDataRepository);
    write({ executionId }: ExecutionRef, payload: ExecutionDataPayload, tx: EntityManager): Promise<number>;
    overwrite(ref: ExecutionRef, payload: ExecutionDataPayload, tx: EntityManager): Promise<number>;
    private measureBundleBytes;
    read({ executionId }: ExecutionRef, tx?: EntityManager): Promise<ExecutionDataPayload | null>;
    readWorkflowData({ executionId }: ExecutionRef, tx?: EntityManager): Promise<BundleWorkflowSnapshot | null>;
    getDataByteSize({ executionId }: ExecutionRef): Promise<number | null>;
    readMany(refs: ExecutionRef[]): Promise<Map<string, ExecutionDataPayload>>;
}
