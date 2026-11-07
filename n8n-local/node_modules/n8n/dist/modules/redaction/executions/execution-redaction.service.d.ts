import { LicenseState, Logger } from '@n8n/backend-common';
import { EventService, type ExecutionRedaction, type ExecutionRedactionOptions, type RedactableExecution } from '@n8n/backend-services';
import { CredentialsPermissionChecker } from '../../../executions/pre-execution-checks/credentials-permission-checker';
import { WorkflowFinderService } from '../../../workflows/workflow-finder.service';
import { FullItemRedactionStrategy } from './strategies/full-item-redaction.strategy';
export declare class ExecutionRedactionService implements ExecutionRedaction {
    private readonly logger;
    private readonly licenseState;
    private readonly workflowFinderService;
    private readonly eventService;
    private readonly fullItemRedactionStrategy;
    private readonly credentialsPermissionChecker;
    constructor(logger: Logger, licenseState: LicenseState, workflowFinderService: WorkflowFinderService, eventService: EventService, fullItemRedactionStrategy: FullItemRedactionStrategy, credentialsPermissionChecker: CredentialsPermissionChecker);
    init(): Promise<void>;
    processExecution(execution: RedactableExecution, options: ExecutionRedactionOptions): Promise<RedactableExecution>;
    processExecutions(executions: RedactableExecution[], options: ExecutionRedactionOptions): Promise<void>;
    private buildPipeline;
    private resolveCredentialInaccessibleExecutions;
    private hasDynamicCredentials;
    private isOwnDynamicCredentialsExecution;
    private policyAllowsReveal;
    private policyAllowsMode;
    private isRedactedBySubWorkflow;
    private resolvePolicy;
    private resolveBasePolicy;
}
