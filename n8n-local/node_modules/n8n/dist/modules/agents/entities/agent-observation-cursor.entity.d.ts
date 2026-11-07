import { WithTimestamps } from '@n8n/db';
export declare class AgentObservationCursorEntity extends WithTimestamps {
    agentId: string;
    observationScopeId: string;
    lastObservedMessageId: string;
    lastObservedAt: Date;
}
