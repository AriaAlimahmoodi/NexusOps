import { WithTimestampsAndStringId } from '@n8n/db';
export type InstanceAiObservationMarker = 'critical' | 'important' | 'info' | 'completion';
export type InstanceAiObservationStatus = 'active' | 'superseded' | 'dropped';
export declare class InstanceAiObservation extends WithTimestampsAndStringId {
    observationScopeId: string;
    marker: InstanceAiObservationMarker;
    text: string;
    parentId: string | null;
    tokenCount: number;
    status: InstanceAiObservationStatus;
    supersededBy: string | null;
}
