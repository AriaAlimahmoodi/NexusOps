import type { ObservationLogTaskKind } from '@n8n/agents';
import { WithTimestamps } from '@n8n/db';
export declare class AgentObservationLockEntity extends WithTimestamps {
    agentId: string;
    observationScopeId: string;
    taskKind: ObservationLogTaskKind;
    holderId: string;
    heldUntil: Date;
}
