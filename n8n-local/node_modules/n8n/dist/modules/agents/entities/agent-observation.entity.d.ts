import type { ObservationLogMarker, ObservationLogStatus } from '@n8n/agents';
import { WithTimestampsAndStringId } from '@n8n/db';
export declare class AgentObservationEntity extends WithTimestampsAndStringId {
    agentId: string;
    observationScopeId: string;
    marker: ObservationLogMarker;
    text: string;
    parentId: string | null;
    tokenCount: number;
    status: ObservationLogStatus;
    supersededBy: string | null;
}
