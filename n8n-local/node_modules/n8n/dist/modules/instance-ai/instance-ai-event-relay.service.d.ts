import { Logger } from '@n8n/backend-common';
import { EventService } from '@n8n/backend-services';
import { InstanceAiMemoryService } from './instance-ai-memory.service';
import { InstanceAiMcpRegistryConnectionRepository } from './repositories/instance-ai-mcp-registry-connection.repository';
export declare class InstanceAiEventRelay {
    private readonly logger;
    private readonly eventService;
    private readonly memoryService;
    private readonly mcpRegistryConnectionRepository;
    constructor(logger: Logger, eventService: EventService, memoryService: InstanceAiMemoryService, mcpRegistryConnectionRepository: InstanceAiMcpRegistryConnectionRepository);
    private handleUserDeleted;
}
