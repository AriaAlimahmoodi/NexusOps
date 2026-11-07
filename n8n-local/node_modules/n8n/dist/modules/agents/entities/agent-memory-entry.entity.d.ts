import type { EpisodicMemoryStatus, JSONObject } from '@n8n/agents';
import { WithTimestampsAndStringId } from '@n8n/db';
export declare class AgentMemoryEntryEntity extends WithTimestampsAndStringId {
    agentId: string;
    resourceId: string;
    content: string;
    contentHash: string;
    status: EpisodicMemoryStatus;
    supersededBy: string | null;
    embeddingModel: string | null;
    embedding: number[] | null;
    metadata: JSONObject | null;
    lastSeenAt: Date;
}
