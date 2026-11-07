import { Logger } from '@n8n/backend-common';
import type { User, WorkflowEntity } from '@n8n/db';
import { ProjectRepository } from '@n8n/db';
import { ProjectService } from '../../../../services/project.service.ee';
import { WebhookService } from '../../../../webhooks/webhook.service';
import { WorkflowService } from '../../../../workflows/workflow.service';
import type { PersistedWorkflowOutcome, PersistedWorkflowPlanItem } from './workflow-import.types';
import { WorkflowPublishingPolicy, type WorkflowPublishingBlockedReason, type WorkflowPublishingOutcome } from './workflow-publishing-policy.types';
import type { PackageWorkflowRequirement } from '../../spec/requirements.schema';
export interface WorkflowPublishingResult {
    workflow: WorkflowEntity;
    publishing: WorkflowPublishingOutcome;
}
export type PackagePublishingResults = ReadonlyMap<string, WorkflowPublishingResult>;
export interface PackagePublishingRequest {
    user: User;
    persisted: PersistedWorkflowOutcome[];
    policy: WorkflowPublishingPolicy;
    subWorkflowRequirements: PackageWorkflowRequirement[] | undefined;
}
export declare class WorkflowPublisher {
    private readonly logger;
    private readonly projectRepository;
    private readonly projectService;
    private readonly workflowService;
    private readonly webhookService;
    constructor(logger: Logger, projectRepository: ProjectRepository, projectService: ProjectService, workflowService: WorkflowService, webhookService: WebhookService);
    applyToPackage({ user, persisted, policy, subWorkflowRequirements, }: PackagePublishingRequest): Promise<PackagePublishingResults>;
    private webhookKeysOnPublish;
    assertCanPublish(user: User, projectId: string, policy: WorkflowPublishingPolicy, projectPendingCreation?: boolean): Promise<void>;
    apply(user: User, item: PersistedWorkflowPlanItem, workflow: WorkflowEntity, policy: WorkflowPublishingPolicy, blockedReason?: WorkflowPublishingBlockedReason, webhookContested?: boolean): Promise<WorkflowPublishingResult>;
    private failed;
}
