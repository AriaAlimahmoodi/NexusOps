import { WithTimestamps } from '@n8n/db';
export type InstanceAiObservationTaskKind = 'observer' | 'reflector';
export declare class InstanceAiObservationLock extends WithTimestamps {
    observationScopeId: string;
    taskKind: InstanceAiObservationTaskKind;
    holderId: string;
    heldUntil: Date;
}
