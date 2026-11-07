import type { AddDatasetRowDto, DatasetCandidateResponse } from '@n8n/api-types';
import type { User } from '@n8n/db';
import { EvaluationConfigRepository } from '@n8n/db';
import { ExecutionPersistence } from '../executions/execution-persistence';
import { ExecutionRedactionServiceProxy } from '@n8n/backend-services';
import { DataTableService } from '../modules/data-table/data-table.service';
export declare class EvaluationDatasetService {
    private readonly configRepository;
    private readonly executionPersistence;
    private readonly executionRedactionServiceProxy;
    private readonly dataTableService;
    constructor(configRepository: EvaluationConfigRepository, executionPersistence: ExecutionPersistence, executionRedactionServiceProxy: ExecutionRedactionServiceProxy, dataTableService: DataTableService);
    getCandidate(user: User, workflowId: string, configId: string, executionId: string): Promise<DatasetCandidateResponse>;
    addRow(user: User, workflowId: string, configId: string, dto: AddDatasetRowDto): Promise<Pick<import("n8n-workflow").DataTableRowReturn, "id">[]>;
    private loadDataTableConfig;
    private loadSuccessfulExecution;
    private dataTableId;
    private assertDataTableAccess;
    private extractFields;
    private extractInputFields;
    private extractOutputFields;
    private suggestMapping;
}
