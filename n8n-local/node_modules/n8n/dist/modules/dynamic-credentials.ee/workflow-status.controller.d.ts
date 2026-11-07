import { WorkflowExecutionStatus } from '@n8n/api-types';
import { GlobalConfig } from '@n8n/config';
import { Request, Response } from 'express';
import { UrlService } from '@n8n/backend-services';
import { WorkflowFinderService } from '../../workflows/workflow-finder.service';
import { CredentialResolverWorkflowService } from './services/credential-resolver-workflow.service';
import { DynamicCredentialCorsService } from './services/dynamic-credential-cors.service';
import { DynamicCredentialWebService } from './services/dynamic-credential-web.service';
export declare class WorkflowStatusController {
    private readonly credentialResolverWorkflowService;
    private readonly urlService;
    private readonly globalConfig;
    private readonly dynamicCredentialCorsService;
    private readonly dynamicCredentialWebService;
    private readonly workflowFinderService;
    constructor(credentialResolverWorkflowService: CredentialResolverWorkflowService, urlService: UrlService, globalConfig: GlobalConfig, dynamicCredentialCorsService: DynamicCredentialCorsService, dynamicCredentialWebService: DynamicCredentialWebService, workflowFinderService: WorkflowFinderService);
    handlePreflightExecutionStatus(req: Request, res: Response): void;
    checkWorkflowForExecution(req: Request, res: Response): Promise<WorkflowExecutionStatus>;
}
