import type { EpisodicMemoryCaptureKind } from '@n8n/agents';
import { DataSource, Repository } from '@n8n/typeorm';
import { AgentMemoryEntryCandidateEntity } from '../entities/agent-memory-entry-candidate.entity';
interface EnqueueCandidateInput {
    agentId: string;
    resourceId: string;
    threadId: string;
    sourceMessageId: string | null;
    runId: string;
    toolCallId: string;
    content: string;
    evidenceText: string;
    kind: EpisodicMemoryCaptureKind;
}
export declare class AgentMemoryEntryCandidateRepository extends Repository<AgentMemoryEntryCandidateEntity> {
    constructor(dataSource: DataSource);
    enqueueCandidate(input: EnqueueCandidateInput): Promise<AgentMemoryEntryCandidateEntity>;
    findPendingForResource(agentId: string, resourceId: string, limit: number): Promise<AgentMemoryEntryCandidateEntity[]>;
    markCandidatesCompleted(agentId: string, ids: string[]): Promise<void>;
    recordCandidateFailure(agentId: string, ids: string[], maxAttempts: number): Promise<void>;
}
export {};
