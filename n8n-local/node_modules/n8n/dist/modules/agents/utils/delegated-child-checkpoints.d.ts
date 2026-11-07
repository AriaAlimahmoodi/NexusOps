import { type SerializableAgentState } from '@n8n/agents';
export interface DelegatedChildCheckpoint {
    runId: string;
    agentId: string;
}
export declare function getDelegatedChildCheckpoints(checkpoint: SerializableAgentState, parentAgentId: string): DelegatedChildCheckpoint[];
