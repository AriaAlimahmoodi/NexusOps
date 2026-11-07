import { AgentEvalRunDetailQueryDto, ApplyAgentEvalSuggestionsDto, ApplyPreviewSuggestionDto, CreateAgentEvalRatingDto, CreateAgentEvalRunDto, CreateDraftDatasetOptionsDto, GenerateDraftCasesOptionsDto, PaginationDto, PreviewRunOptionsDto, RerunResultOptionsDto, UpdateAgentEvalDatasetDto, type AgentEvalDatasetRecord, type AgentEvalRatingRecord, type AgentEvalResultRecord, type AgentEvalRunDetail, type AgentEvalRunList, type AgentEvalRunRecord, type AgentEvalRunSummary, type ApplyAgentEvalSuggestionsResult, type ApplyPreviewSuggestionResult, type CreateDraftDatasetResult, type GenerateDraftCasesResult, type PreviewRunResult } from '@n8n/api-types';
import type { AuthenticatedRequest } from '@n8n/db';
import { CollaborationService } from '../../collaboration/collaboration.service';
import { AgentEvalRatingService } from './agent-eval-rating.service';
import { AgentEvalService } from './agent-eval.service';
import { AgentEvalsFlagGate } from './agent-evals-flag-gate';
type AgentParam = {
    projectId: string;
    agentId: string;
};
type DatasetParam = AgentParam & {
    datasetId: string;
};
type RunParam = AgentParam & {
    runId: string;
};
type ResultParam = AgentParam & {
    resultId: string;
};
export declare class AgentEvalsController {
    private readonly service;
    private readonly ratingService;
    private readonly flagGate;
    private readonly collaborationService;
    constructor(service: AgentEvalService, ratingService: AgentEvalRatingService, flagGate: AgentEvalsFlagGate, collaborationService: CollaborationService);
    listDatasets(req: AuthenticatedRequest<AgentParam>): Promise<AgentEvalDatasetRecord[]>;
    createDraftDataset(req: AuthenticatedRequest<AgentParam>, _res: unknown, payload: CreateDraftDatasetOptionsDto): Promise<CreateDraftDatasetResult>;
    createDataset(req: AuthenticatedRequest<AgentParam>): Promise<AgentEvalDatasetRecord>;
    getDataset(req: AuthenticatedRequest<DatasetParam>): Promise<AgentEvalDatasetRecord>;
    updateDataset(req: AuthenticatedRequest<DatasetParam>, _res: unknown, payload: UpdateAgentEvalDatasetDto): Promise<AgentEvalDatasetRecord>;
    deleteDraftDataset(req: AuthenticatedRequest<DatasetParam>): Promise<{
        success: true;
    }>;
    deleteDataset(req: AuthenticatedRequest<DatasetParam>): Promise<{
        success: true;
    }>;
    generateDraftCases(req: AuthenticatedRequest<AgentParam>, _res: unknown, payload: GenerateDraftCasesOptionsDto): Promise<GenerateDraftCasesResult>;
    previewRun(req: AuthenticatedRequest<AgentParam>, _res: unknown, payload: PreviewRunOptionsDto): Promise<PreviewRunResult>;
    applyPreviewSuggestion(req: AuthenticatedRequest<AgentParam>, _res: unknown, payload: ApplyPreviewSuggestionDto): Promise<ApplyPreviewSuggestionResult>;
    startRun(req: AuthenticatedRequest<DatasetParam>, _res: unknown, payload: CreateAgentEvalRunDto): Promise<AgentEvalRunRecord>;
    listRuns(req: AuthenticatedRequest<DatasetParam>, _res: unknown, query: PaginationDto): Promise<AgentEvalRunList>;
    getRun(req: AuthenticatedRequest<RunParam>, _res: unknown, query: AgentEvalRunDetailQueryDto): Promise<AgentEvalRunDetail>;
    getRunSummary(req: AuthenticatedRequest<RunParam>): Promise<AgentEvalRunSummary>;
    cancelRun(req: AuthenticatedRequest<RunParam>): Promise<AgentEvalRunRecord>;
    rerunResult(req: AuthenticatedRequest<ResultParam>, _res: unknown, payload: RerunResultOptionsDto): Promise<AgentEvalResultRecord>;
    applySuggestions(req: AuthenticatedRequest<AgentParam>, _res: unknown, payload: ApplyAgentEvalSuggestionsDto): Promise<ApplyAgentEvalSuggestionsResult>;
    acceptResult(req: AuthenticatedRequest<ResultParam>): Promise<AgentEvalResultRecord>;
    deleteResult(req: AuthenticatedRequest<ResultParam>): Promise<{
        success: true;
    }>;
    rateResult(req: AuthenticatedRequest<ResultParam>, _res: unknown, payload: CreateAgentEvalRatingDto): Promise<AgentEvalRatingRecord>;
    listRatingsForResult(req: AuthenticatedRequest<ResultParam>): Promise<AgentEvalRatingRecord[]>;
    listLatestRatingsForRun(req: AuthenticatedRequest<RunParam>): Promise<AgentEvalRatingRecord[]>;
}
export {};
