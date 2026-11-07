import { WithTimestamps } from '@n8n/db';
import { InstanceAiThread } from './instance-ai-thread.entity';
export declare class InstanceAiEventLogEntry extends WithTimestamps {
    thread: InstanceAiThread;
    threadId: string;
    seq: number;
    runId: string;
    type: string;
    payload: string;
}
