import { WithTimestamps } from '@n8n/db';
export declare class InstanceAiObservationCursor extends WithTimestamps {
    observationScopeId: string;
    lastObservedMessageId: string;
    lastObservedAt: Date;
}
