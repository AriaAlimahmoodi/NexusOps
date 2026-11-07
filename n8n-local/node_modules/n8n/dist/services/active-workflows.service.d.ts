import { Logger } from '@n8n/backend-common';
import { WorkflowsConfig } from '@n8n/config';
import type { User } from '@n8n/db';
import { WorkflowRepository } from '@n8n/db';
import { ActivationErrorsService } from '../activation-errors.service';
import { WorkflowPublicationStatusService } from '../workflows/publication/workflow-publication-status.service';
import { WorkflowFinderService } from '../workflows/workflow-finder.service';
import { WorkflowSharingService } from '@n8n/backend-services';
export declare class ActiveWorkflowsService {
    private readonly logger;
    private readonly workflowRepository;
    private readonly workflowSharingService;
    private readonly activationErrorsService;
    private readonly workflowFinderService;
    private readonly workflowsConfig;
    private readonly workflowPublicationStatusService;
    constructor(logger: Logger, workflowRepository: WorkflowRepository, workflowSharingService: WorkflowSharingService, activationErrorsService: ActivationErrorsService, workflowFinderService: WorkflowFinderService, workflowsConfig: WorkflowsConfig, workflowPublicationStatusService: WorkflowPublicationStatusService);
    getAllActiveIdsInStorage(): Promise<string[]>;
    getAllActiveIdsFor(user: User): Promise<string[]>;
    getActivationError(workflowId: string, user: User): Promise<string | null>;
    private dropActivationFailures;
}
