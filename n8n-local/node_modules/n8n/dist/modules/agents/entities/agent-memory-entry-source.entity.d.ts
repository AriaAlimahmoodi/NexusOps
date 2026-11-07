import { WithTimestampsAndStringId } from '@n8n/db';
export declare class AgentMemoryEntrySourceEntity extends WithTimestampsAndStringId {
    agentId: string;
    memoryEntryId: string;
    observationId: string | null;
    candidateId: string | null;
    threadId: string;
    evidenceHash: string;
    evidenceText: string;
}
