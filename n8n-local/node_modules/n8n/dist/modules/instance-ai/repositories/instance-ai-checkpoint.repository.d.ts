import type { SerializableAgentState } from '@n8n/agents';
import { DataSource, Repository } from '@n8n/typeorm';
import { InstanceAiCheckpoint } from '../entities/instance-ai-checkpoint.entity';
export declare class InstanceAiCheckpointRepository extends Repository<InstanceAiCheckpoint> {
    constructor(dataSource: DataSource);
    findActiveByThreadId(threadId: string): Promise<InstanceAiCheckpoint[]>;
    claimSuspendedForResume(key: string, expectedState: SerializableAgentState): Promise<boolean>;
    findActiveByResourceId(resourceId: string): Promise<InstanceAiCheckpoint | undefined>;
}
