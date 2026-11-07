import { EventService } from '@n8n/backend-services';
import { DatabaseConfig, ExecutionsConfig } from '@n8n/config';
import type { CreateExecutionPayload, ExecutionDataStorageLocation, ExecutionDeletionCriteria, FindManyOptions, FindOptionsWhere, IExecutionBase, IExecutionFlattedDb, IExecutionResponse, OperationContext, UpdateExecutionConditions } from '@n8n/db';
import { ExecutionEntity, ExecutionRepository } from '@n8n/db';
import { BinaryDataService, ErrorReporter, StorageConfig } from 'n8n-core';
import type { ExecutionStatus } from 'n8n-workflow';
import { DbStore } from './execution-data/db-store';
import { ExecutionDataJsonStore } from './execution-data/execution-data-json-store';
import { type ExecutionRef } from './execution-data/types';
type DeletionTarget = ExecutionRef & {
    storedAt: ExecutionDataStorageLocation;
};
export declare class ExecutionPersistence {
    private readonly executionRepository;
    private readonly binaryDataService;
    private readonly jsonStore;
    private readonly dbStore;
    private readonly storageConfig;
    private readonly executionsConfig;
    private readonly databaseConfig;
    private readonly errorReporter;
    private readonly eventService;
    private static readonly bulkDeletionBatchSize;
    private static readonly maxBulkDeletionBatchesPerRun;
    constructor(executionRepository: ExecutionRepository, binaryDataService: BinaryDataService, jsonStore: ExecutionDataJsonStore, dbStore: DbStore, storageConfig: StorageConfig, executionsConfig: ExecutionsConfig, databaseConfig: DatabaseConfig, errorReporter: ErrorReporter, eventService: EventService);
    create(payload: CreateExecutionPayload, ctx?: OperationContext): Promise<string>;
    private reclaimTombstone;
    private deleteReclaimedTombstoneData;
    updateExistingExecution(executionId: string, execution: Partial<IExecutionResponse>, conditions?: UpdateExecutionConditions): Promise<boolean>;
    findSingleExecution(id: string, options?: {
        includeData: true;
        includeAnnotation?: boolean;
        unflattenData: true;
        where?: FindOptionsWhere<ExecutionEntity>;
        maxDataSizeBytes?: number;
    }): Promise<IExecutionResponse | undefined>;
    findSingleExecution(id: string, options?: {
        includeData: true;
        includeAnnotation?: boolean;
        unflattenData?: false | undefined;
        where?: FindOptionsWhere<ExecutionEntity>;
    }): Promise<IExecutionFlattedDb | undefined>;
    findSingleExecution(id: string, options?: {
        includeData?: boolean;
        includeAnnotation?: boolean;
        unflattenData?: boolean;
        where?: FindOptionsWhere<ExecutionEntity>;
        maxDataSizeBytes?: number;
    }): Promise<IExecutionBase | undefined>;
    findMultipleExecutions(queryParams: FindManyOptions<ExecutionEntity>, options?: {
        unflattenData: true;
        includeData?: true;
        maxDataSizeBytes?: number;
    }): Promise<IExecutionResponse[]>;
    findMultipleExecutions(queryParams: FindManyOptions<ExecutionEntity>, options?: {
        unflattenData?: false | undefined;
        includeData?: true;
    }): Promise<IExecutionFlattedDb[]>;
    findMultipleExecutions(queryParams: FindManyOptions<ExecutionEntity>, options?: {
        unflattenData?: boolean;
        includeData?: boolean;
        maxDataSizeBytes?: number;
    }): Promise<IExecutionBase[]>;
    findMultipleExecutionsWithUnreadable(queryParams: FindManyOptions<ExecutionEntity>): Promise<{
        executions: IExecutionResponse[];
        unreadableIds: string[];
    }>;
    private readMultiple;
    findWithUnflattenedData(executionId: string, accessibleWorkflowIds: string[]): Promise<IExecutionResponse | undefined>;
    findOneInWorkflows(executionId: string, workflowIds: string[], options?: {
        includeData?: boolean;
        includeAnnotation?: boolean;
        maxDataSizeBytes?: number;
    }): Promise<IExecutionResponse | IExecutionBase | undefined>;
    findStatusesByIds(ids: string[]): Promise<Array<{
        id: string;
        status: ExecutionStatus;
    }>>;
    findManyInWorkflows(workflowIds: string[], options: {
        limit: number;
        includeData?: boolean;
        lastId?: string;
        status?: ExecutionStatus;
        excludedExecutionsIds?: string[];
        startedAfter?: string;
        startedBefore?: string;
    }, maxDataSizeBytes?: number): Promise<IExecutionBase[]>;
    deleteInFlightExecution(target: DeletionTarget): Promise<void>;
    hardDelete(target: DeletionTarget | DeletionTarget[]): Promise<void>;
    hardDeleteBy(criteria: ExecutionDeletionCriteria): Promise<void>;
    hardDeleteByWorkflowId(workflowId: string): Promise<void>;
    private maxBulkDeletionBatches;
    private estimateExecutionsTableSize;
    private toBlobRefs;
    private updateEntityOnly;
    private applyDataUpdate;
    private pickUpdatableEntityColumns;
    private buildEntityWhereCondition;
    private trackRead;
    private trackWrite;
    private writeData;
    private readData;
    private assembleExecution;
    private maxDisplayDataSize;
    private isKnownOversize;
    private assembleSkippedExecution;
    private assembleOversizedExecution;
    private skipOversizedEntities;
    private assembleReadExecution;
    private parseExecutionData;
    private serializeAnnotation;
    private isDuplicateExecutionError;
}
export {};
