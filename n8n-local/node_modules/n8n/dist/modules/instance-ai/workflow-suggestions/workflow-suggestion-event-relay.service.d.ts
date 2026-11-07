import { Logger } from '@n8n/backend-common';
import { EventService } from '@n8n/backend-services';
import { WorkflowSuggestionService } from './workflow-suggestion.service';
export declare class WorkflowSuggestionEventRelay {
    constructor(events: EventService, suggestions: WorkflowSuggestionService, logger: Logger);
}
