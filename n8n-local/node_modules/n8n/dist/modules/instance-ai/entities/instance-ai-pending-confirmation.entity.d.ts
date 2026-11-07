import { User, WithTimestamps } from '@n8n/db';
import { InstanceAiCheckpoint } from './instance-ai-checkpoint.entity';
import { InstanceAiThread } from './instance-ai-thread.entity';
export type InstanceAiPendingConfirmationKind = 'suspended' | 'inline';
export declare class InstanceAiPendingConfirmation extends WithTimestamps {
    requestId: string;
    thread: InstanceAiThread;
    threadId: string;
    user: User;
    userId: string;
    kind: InstanceAiPendingConfirmationKind;
    runId: string;
    toolCallId: string | null;
    messageGroupId: string | null;
    checkpoint: InstanceAiCheckpoint | null;
    checkpointKey: string | null;
    checkpointTaskId: string | null;
    expiresAt: Date | null;
}
