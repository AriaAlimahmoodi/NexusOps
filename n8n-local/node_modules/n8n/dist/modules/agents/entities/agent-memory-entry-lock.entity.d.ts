import { WithTimestamps } from '@n8n/db';
export declare class AgentMemoryEntryLockEntity extends WithTimestamps {
    agentId: string;
    resourceId: string;
    holderId: string;
    heldUntil: Date;
}
