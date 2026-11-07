import { Logger } from '@n8n/backend-common';
import { EventService } from '@n8n/backend-services';
import { UserRepository } from '@n8n/db';
import { EventRelay } from '../../events/relays/event-relay';
import { UserManagementMailer } from '../../user-management/email';
export declare class WorkflowFailureNotificationEventRelay extends EventRelay {
    private readonly mailer;
    private readonly userRepository;
    private readonly logger;
    constructor(eventService: EventService, mailer: UserManagementMailer, userRepository: UserRepository, logger: Logger);
    init(): void;
    private onFirstProductionWorkflowFailed;
}
