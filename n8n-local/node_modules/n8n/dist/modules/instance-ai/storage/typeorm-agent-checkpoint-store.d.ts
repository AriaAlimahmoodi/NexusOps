import type { CheckpointStore, SerializableAgentState } from '@n8n/agents';
import { InstanceAiCheckpointRepository } from '../repositories/instance-ai-checkpoint.repository';
export declare class TypeORMAgentCheckpointStore implements CheckpointStore {
    private readonly checkpointRepo;
    constructor(checkpointRepo: InstanceAiCheckpointRepository);
    save(key: string, state: SerializableAgentState): Promise<void>;
    load(key: string): Promise<SerializableAgentState | undefined>;
    claimForResume(key: string, state: SerializableAgentState): Promise<boolean>;
    delete(key: string): Promise<void>;
    markExpiredOlderThan(olderThan: Date): Promise<number>;
    deleteOlderThan(olderThan: Date): Promise<number>;
    findSuspendedSubAgentResumeInfo(resourceId: string): Promise<{
        runId: string;
        toolCallId: string;
        persistence: {
            threadId: string;
            resourceId: string;
        };
    } | undefined>;
    hardDeleteExpiredOlderThan(olderThan: Date): Promise<number>;
    private getRunId;
}
