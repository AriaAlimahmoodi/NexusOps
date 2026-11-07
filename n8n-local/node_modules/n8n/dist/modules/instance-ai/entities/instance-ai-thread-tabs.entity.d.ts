import type { InstanceAiThreadTabsState } from '@n8n/api-types';
import { User, WithTimestamps } from '@n8n/db';
import { InstanceAiThread } from './instance-ai-thread.entity';
export declare class InstanceAiThreadTabs extends WithTimestamps {
    thread: InstanceAiThread;
    threadId: string;
    user: User;
    userId: string;
    state: InstanceAiThreadTabsState;
}
