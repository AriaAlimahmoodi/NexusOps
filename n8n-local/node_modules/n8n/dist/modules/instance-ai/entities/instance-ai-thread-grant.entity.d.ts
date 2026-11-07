import { User, WithTimestamps } from '@n8n/db';
import { InstanceAiThread } from './instance-ai-thread.entity';
export declare class InstanceAiThreadGrant extends WithTimestamps {
    thread: InstanceAiThread;
    threadId: string;
    user: User;
    userId: string;
    grantKey: string;
}
