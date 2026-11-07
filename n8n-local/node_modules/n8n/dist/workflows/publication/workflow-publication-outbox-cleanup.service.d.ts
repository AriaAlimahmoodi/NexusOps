import { Logger } from '@n8n/backend-common';
import { EventService } from '@n8n/backend-services';
import { WorkflowsConfig } from '@n8n/config';
import { WorkflowPublicationOutboxRepository } from '@n8n/db';
import { Tracing } from 'n8n-core';
export declare class WorkflowPublicationOutboxCleanupService {
    private readonly workflowsConfig;
    private readonly outboxRepository;
    private readonly tracing;
    private readonly eventService;
    private readonly logger;
    constructor(logger: Logger, workflowsConfig: WorkflowsConfig, outboxRepository: WorkflowPublicationOutboxRepository, tracing: Tracing, eventService: EventService);
    cleanup(signal: AbortSignal): Promise<void>;
}
