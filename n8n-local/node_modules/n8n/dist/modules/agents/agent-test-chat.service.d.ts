import { AgentChatAttachmentService } from './agent-chat-attachment.service';
import { N8nMemory } from './integrations/n8n-memory';
export declare function chatThreadId(agentId: string, userId?: string): string;
export declare class AgentTestChatService {
    private readonly n8nMemory;
    private readonly agentChatAttachmentService;
    constructor(n8nMemory: N8nMemory, agentChatAttachmentService: AgentChatAttachmentService);
    getTestChatMessages(agentId: string, userId: string): Promise<import("@n8n/agents").AgentDbMessage[]>;
    clearTestChatMessages(agentId: string, userId: string): Promise<void>;
    clearAllTestChatMessages(agentId: string): Promise<void>;
}
