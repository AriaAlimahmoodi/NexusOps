import { Logger } from '@n8n/backend-common';
import { EventService } from '@n8n/backend-services';
import { AgentDependencyIndexService } from './agent-dependency-index.service';
export declare class AgentDependencyIndexListener {
    private readonly logger;
    private readonly eventService;
    private readonly indexService;
    constructor(logger: Logger, eventService: EventService, indexService: AgentDependencyIndexService);
    init(): void;
    private subscribeToWorkflowEvents;
    private run;
}
