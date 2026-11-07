import { WithTimestamps } from '@n8n/db';
export declare class InstanceAiMessage extends WithTimestamps {
    id: string;
    threadId: string;
    content: string;
    role: string;
    type: string | null;
    resourceId: string | null;
}
