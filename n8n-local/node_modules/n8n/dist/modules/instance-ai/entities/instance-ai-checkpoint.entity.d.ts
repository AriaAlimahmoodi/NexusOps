import { WithTimestamps } from '@n8n/db';
import type { SerializableAgentState } from '@n8n/agents';
import { InstanceAiThread } from './instance-ai-thread.entity';
export declare class InstanceAiCheckpoint extends WithTimestamps {
    key: string;
    runId: string | null;
    hostRunId: string | null;
    thread: InstanceAiThread;
    threadId: string;
    resourceId: string | null;
    state: SerializableAgentState | null;
    expiredAt: Date | null;
}
