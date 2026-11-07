import { AddRunToCollectionDto, CreateEvaluationCollectionDto, UpdateEvaluationCollectionDto } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import type { AuthenticatedRequest } from '@n8n/db';
import { PostHogClient } from '../posthog';
import { EvaluationCollectionService } from './evaluation-collection.service';
type WorkflowParam = {
    workflowId: string;
};
type CollectionParam = {
    workflowId: string;
    collectionId: string;
};
type CollectionRunParam = {
    workflowId: string;
    collectionId: string;
    runId: string;
};
type EvalVersionsQuery = {
    evaluationConfigId?: string;
};
export declare class EvaluationCollectionsController {
    private readonly service;
    private readonly postHogClient;
    private readonly logger;
    constructor(service: EvaluationCollectionService, postHogClient: PostHogClient, logger: Logger);
    private assertFlagEnabled;
    list(req: AuthenticatedRequest<WorkflowParam>): Promise<import("@n8n/api-types").EvaluationCollectionRecord[]>;
    get(req: AuthenticatedRequest<CollectionParam>): Promise<import("@n8n/api-types").EvaluationCollectionDetail>;
    create(req: AuthenticatedRequest<WorkflowParam>, _res: unknown, payload: CreateEvaluationCollectionDto): Promise<{
        id: string;
        name: string;
        description: string | null;
        workflowId: string;
        evaluationConfigId: string;
        createdById: string | null;
        createdAt: string;
        updatedAt: string;
        runCount: number;
        runsStartedIds: string[];
    }>;
    rerun(req: AuthenticatedRequest<CollectionParam>): Promise<{
        id: string;
        name: string;
        description: string | null;
        workflowId: string;
        evaluationConfigId: string;
        createdById: string | null;
        createdAt: string;
        updatedAt: string;
        runCount: number;
        runsStartedIds: string[];
    }>;
    update(req: AuthenticatedRequest<CollectionParam>, _res: unknown, payload: UpdateEvaluationCollectionDto): Promise<import("@n8n/api-types").EvaluationCollectionRecord>;
    delete(req: AuthenticatedRequest<CollectionParam>): Promise<{
        success: boolean;
        runsUnlinked: number;
    }>;
    addRun(req: AuthenticatedRequest<CollectionParam>, _res: unknown, payload: AddRunToCollectionDto): Promise<import("@n8n/api-types").EvaluationCollectionDetail>;
    removeRun(req: AuthenticatedRequest<CollectionRunParam>): Promise<import("@n8n/api-types").EvaluationCollectionDetail>;
    listVersions(req: AuthenticatedRequest<WorkflowParam, unknown, unknown, EvalVersionsQuery>): Promise<import("@n8n/api-types").EvalVersionsResponse>;
}
export {};
