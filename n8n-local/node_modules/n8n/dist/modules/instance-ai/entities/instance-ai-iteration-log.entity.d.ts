import { WithTimestamps } from '@n8n/db';
export declare class InstanceAiIterationLog extends WithTimestamps {
    id: string;
    threadId: string;
    taskKey: string;
    entry: string;
}
