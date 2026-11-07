import { Logger } from '@n8n/backend-common';
import { SystemTask } from '@n8n/decorators';
import type { SystemTaskSchedule } from '@n8n/decorators';
import { AgentChatAttachmentService } from './agent-chat-attachment.service';
import { AgentRepository } from './repositories/agent.repository';
export declare class AgentChannelMediaRetentionTask implements SystemTask {
    private readonly agentRepository;
    private readonly attachmentService;
    private readonly logger;
    readonly name = "agent-channel-media-retention";
    readonly schedule: SystemTaskSchedule;
    readonly target: import("@n8n/decorators").ClusterTarget;
    constructor(agentRepository: AgentRepository, attachmentService: AgentChatAttachmentService, logger: Logger);
    run(signal: AbortSignal): Promise<void>;
}
