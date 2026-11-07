import type { DeleteExecutionsDto } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { EventService, ExecutionRedactionServiceProxy } from '@n8n/backend-services';
import { GlobalConfig } from '@n8n/config';
import type { ExecutionSummaries, IExecutionBase, IExecutionResponse, User } from '@n8n/db';
import { AnnotationTagMappingRepository, ExecutionAnnotationRepository, ExecutionRepository, WorkflowHistoryRepository, WorkflowRepository } from '@n8n/db';
import type { ExecutionError, ExecutionStatus, INode, IWorkflowBase, WorkflowExecuteMode } from 'n8n-workflow';
import { Workflow } from 'n8n-workflow';
import { ActiveExecutions } from '../active-executions';
import { ConcurrencyControlService } from '../concurrency/concurrency-control.service';
import type { IExecutionFlattedResponse } from '../interfaces';
import { License } from '../license';
import { NodeTypes } from '../node-types';
import { ExecutionStopService } from '../scaling/execution-stop.service';
import { EngineDataPlaneProxyService } from '../services/engine-data-plane-proxy.service';
import { OwnershipService } from '../services/ownership.service';
import { WaitTracker } from '../wait-tracker';
import { WorkflowRunner } from '../workflow-runner';
import { EngineV2ExecutionReader } from './engine-v2-execution-reader.service';
import { ExecutionPersistence } from './execution-persistence';
import type { ExecutionRequest, StopResult } from './execution.types';
export declare const schemaGetExecutionsQueryFilter: {
    $id: string;
    type: string;
    properties: {
        mode: {
            type: string;
        };
        status: {
            type: string;
            items: {
                type: string;
            };
        };
        workflowId: {
            anyOf: {
                type: string;
            }[];
        };
        metadata: {
            type: string;
            items: {
                $ref: string;
            };
        };
        startedAfter: {
            type: string;
        };
        startedBefore: {
            type: string;
        };
        annotationTags: {
            type: string;
            items: {
                type: string;
            };
        };
        vote: {
            type: string;
        };
        projectId: {
            type: string;
        };
        workflowVersionId: {
            type: string;
        };
    };
    $defs: {
        metadata: {
            type: string;
            required: string[];
            properties: {
                key: {
                    type: string;
                };
                value: {
                    type: string;
                };
                exactMatch: {
                    type: string;
                    default: boolean;
                };
            };
        };
    };
};
export declare const allowedExecutionsQueryFilterFields: string[];
export declare class ExecutionService {
    private readonly globalConfig;
    private readonly logger;
    private readonly activeExecutions;
    private readonly executionAnnotationRepository;
    private readonly annotationTagMappingRepository;
    private readonly executionRepository;
    private readonly executionPersistence;
    private readonly workflowHistoryRepository;
    private readonly workflowRepository;
    private readonly nodeTypes;
    private readonly waitTracker;
    private readonly workflowRunner;
    private readonly concurrencyControl;
    private readonly license;
    private readonly eventService;
    private readonly executionRedactionServiceProxy;
    private readonly executionStopService;
    private readonly ownershipService;
    private readonly engineV2ExecutionReader;
    private readonly engineDataPlane;
    constructor(globalConfig: GlobalConfig, logger: Logger, activeExecutions: ActiveExecutions, executionAnnotationRepository: ExecutionAnnotationRepository, annotationTagMappingRepository: AnnotationTagMappingRepository, executionRepository: ExecutionRepository, executionPersistence: ExecutionPersistence, workflowHistoryRepository: WorkflowHistoryRepository, workflowRepository: WorkflowRepository, nodeTypes: NodeTypes, waitTracker: WaitTracker, workflowRunner: WorkflowRunner, concurrencyControl: ConcurrencyControlService, license: License, eventService: EventService, executionRedactionServiceProxy: ExecutionRedactionServiceProxy, executionStopService: ExecutionStopService, ownershipService: OwnershipService, engineV2ExecutionReader: EngineV2ExecutionReader, engineDataPlane: EngineDataPlaneProxyService);
    findOne(req: ExecutionRequest.GetOne | ExecutionRequest.Update, sharedWorkflowIds: string[]): Promise<IExecutionFlattedResponse | undefined>;
    getLastSuccessfulExecution(workflowId: string, user: User, redactExecutionData?: boolean): Promise<IExecutionResponse | undefined>;
    retry({ executionId, options, sharedWorkflowIds, user, }: {
        executionId: string;
        options?: {
            loadWorkflow?: boolean;
            redactExecutionData?: boolean;
        };
        sharedWorkflowIds: string[];
        user: User;
    }): Promise<Omit<IExecutionResponse, 'createdAt'>>;
    delete(user: User, payload: DeleteExecutionsDto, sharedWorkflowIds: string[]): Promise<void>;
    createErrorExecution(error: ExecutionError, node: INode, workflowData: IWorkflowBase, workflow: Workflow, mode: WorkflowExecuteMode): Promise<void>;
    getConcurrentExecutionsCount(): Promise<number>;
    private isConcurrentExecutionsCountSupported;
    findAllEnqueuedExecutions(): Promise<{
        executions: IExecutionResponse[];
        unreadableIds: string[];
    }>;
    stop(executionId: string, sharedWorkflowIds: string[]): Promise<StopResult>;
    stopMany(query: ExecutionSummaries.StopExecutionFilterQuery, sharedWorkflowIds: string[]): Promise<number>;
    private assertStoppable;
    private notStoppableError;
    private stopEngineV2Execution;
    private stopInRegularMode;
    private stopInScalingMode;
    private stopDuringRun;
    annotate(executionId: string, updateData: ExecutionRequest.ExecutionUpdatePayload, sharedWorkflowIds: string[]): Promise<void>;
    findOneInWorkflows(executionId: string, workflowIds: string[], options?: {
        includeData?: boolean;
        includeAnnotation?: boolean;
        maxDataSizeBytes?: number;
    }): Promise<IExecutionBase | IExecutionResponse | undefined>;
    findManyAndCount(workflowIds: string[], options: {
        limit: number;
        includeData?: boolean;
        lastId?: string;
        status?: ExecutionStatus;
        excludeRunning?: boolean;
        maxDataSizeBytes?: number;
        startedAfter?: string;
        startedBefore?: string;
    }): Promise<{
        executions: IExecutionBase[];
        count: number;
    }>;
    deleteOne(executionId: string, sharedWorkflowIds: string[]): Promise<IExecutionBase | IExecutionResponse>;
    getExecutionTags(executionId: string, sharedWorkflowIds: string[]): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    updateExecutionTags(executionId: string, tagIds: string[], sharedWorkflowIds: string[]): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getExecutedVersions(workflowId: string): Promise<Array<{
        versionId: string;
        name: string | null;
        createdAt: Date;
    }>>;
}
