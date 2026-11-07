import { WithTimestamps } from '@n8n/db';
import { AgentExecutionThread } from './agent-execution-thread.entity';
export declare class AgentThreadGrant extends WithTimestamps {
    thread: AgentExecutionThread;
    threadId: string;
    grantKey: string;
}
