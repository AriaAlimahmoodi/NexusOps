import type { EpisodicMemoryCaptureKind, EpisodicMemoryCaptureStatus } from '@n8n/agents';
import { WithTimestampsAndStringId } from '@n8n/db';
export declare class AgentMemoryEntryCandidateEntity extends WithTimestampsAndStringId {
    agentId: string;
    resourceId: string;
    threadId: string;
    sourceMessageId: string | null;
    runId: string;
    toolCallId: string;
    content: string;
    evidenceText: string;
    kind: EpisodicMemoryCaptureKind;
    status: EpisodicMemoryCaptureStatus;
    attemptCount: number;
}
