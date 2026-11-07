import { Logger } from '@n8n/backend-common';
import { EventService } from '@n8n/backend-services';
import { ErrorReporter } from 'n8n-core';
import { MigrationFindingSyncService } from './migration-finding-sync.service';
export declare class MigrationFindingSyncListener {
    private readonly eventService;
    private readonly syncService;
    private readonly logger;
    private readonly errorReporter;
    constructor(eventService: EventService, syncService: MigrationFindingSyncService, logger: Logger, errorReporter: ErrorReporter);
    init(): void;
    private syncWorkflow;
}
