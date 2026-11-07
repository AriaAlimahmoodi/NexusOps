import { Logger } from '@n8n/backend-common';
import { WorkflowRepository } from '@n8n/db';
import { ErrorReporter } from 'n8n-core';
import type { IDataObject, Workflow } from 'n8n-workflow';
export declare class WorkflowStaticDataService {
    private readonly logger;
    private readonly errorReporter;
    private readonly workflowRepository;
    constructor(logger: Logger, errorReporter: ErrorReporter, workflowRepository: WorkflowRepository);
    getStaticDataById(workflowId: string): Promise<IDataObject>;
    saveStaticData(workflow: Workflow): Promise<void>;
    saveStaticDataById(workflowId: string, newStaticData: IDataObject): Promise<void>;
}
