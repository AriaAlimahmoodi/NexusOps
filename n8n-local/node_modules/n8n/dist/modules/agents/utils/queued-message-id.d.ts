import type { AgentQueuedMessage } from '../types/agent-queued-message';
export declare function queuedMessageId(agentId: string, threadId: string, payload: AgentQueuedMessage): string | undefined;
