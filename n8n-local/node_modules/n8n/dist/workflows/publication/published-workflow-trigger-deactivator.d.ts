import { Logger } from '@n8n/backend-common';
import { EventService } from '@n8n/backend-services';
import { WorkflowsConfig } from '@n8n/config';
import { ActiveWorkflowTriggers, ErrorReporter, InstanceSettings } from 'n8n-core';
import { WorkflowPublicationLifecycleLock } from '../../workflows/publication/workflow-publication-lifecycle-lock';
import { WorkflowPublicationOutboxConsumer } from '../../workflows/publication/workflow-publication-outbox-consumer';
export declare class PublishedWorkflowTriggerDeactivator {
    private readonly logger;
    private readonly workflowsConfig;
    private readonly errorReporter;
    private readonly lifecycleLock;
    private readonly activeWorkflowTriggers;
    private readonly outboxConsumer;
    private readonly instanceSettings;
    private readonly eventService;
    private isShuttingDown;
    private consecutiveLockSkipsByWorkflowId;
    constructor(logger: Logger, workflowsConfig: WorkflowsConfig, errorReporter: ErrorReporter, lifecycleLock: WorkflowPublicationLifecycleLock, activeWorkflowTriggers: ActiveWorkflowTriggers, outboxConsumer: WorkflowPublicationOutboxConsumer, instanceSettings: InstanceSettings, eventService: EventService);
    private get leaseMs();
    deactivateAllNonWebhookTriggers(): Promise<void>;
    sweepGhostTriggers(): Promise<number>;
    private trackSkippedWhileLocked;
    private deactivateWorkflows;
    shutdown(): void;
}
