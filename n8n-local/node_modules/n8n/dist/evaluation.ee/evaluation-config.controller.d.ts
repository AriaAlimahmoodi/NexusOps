import type { AuthenticatedRequest } from '@n8n/db';
import { WorkflowFinderService } from '../workflows/workflow-finder.service';
import { EvaluationConfigService } from './evaluation-config.service';
import { EvaluationDatasetService } from './evaluation-dataset.service';
type WorkflowParam = {
    workflowId: string;
};
type ConfigParam = {
    workflowId: string;
    configId: string;
};
export declare class EvaluationConfigController {
    private readonly service;
    private readonly datasetService;
    private readonly workflowFinderService;
    constructor(service: EvaluationConfigService, datasetService: EvaluationDatasetService, workflowFinderService: WorkflowFinderService);
    private assertWorkflowAccess;
    list(req: AuthenticatedRequest<WorkflowParam>): Promise<import("@n8n/db").EvaluationConfig[]>;
    get(req: AuthenticatedRequest<ConfigParam>): Promise<import("@n8n/db").EvaluationConfig>;
    create(req: AuthenticatedRequest<WorkflowParam>): Promise<import("@n8n/db").EvaluationConfig>;
    update(req: AuthenticatedRequest<ConfigParam>): Promise<import("@n8n/db").EvaluationConfig>;
    delete(req: AuthenticatedRequest<ConfigParam>): Promise<{
        success: boolean;
    }>;
    datasetCandidate(req: AuthenticatedRequest<ConfigParam, {}, {}, {
        executionId?: string;
    }>): Promise<import("@n8n/api-types").DatasetCandidateResponse>;
    addDatasetRow(req: AuthenticatedRequest<ConfigParam>): Promise<Pick<import("n8n-workflow").DataTableRowReturn, "id">[]>;
}
export {};
