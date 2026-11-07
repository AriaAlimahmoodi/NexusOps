import { WithTimestamps } from '@n8n/db';
export declare class InstanceAiResource extends WithTimestamps {
    id: string;
    workingMemory: string | null;
    metadata: Record<string, unknown> | null;
}
