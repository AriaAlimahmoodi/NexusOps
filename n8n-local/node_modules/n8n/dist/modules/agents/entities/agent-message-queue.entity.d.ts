import { WithTimestamps } from '@n8n/db';
import { type Relation } from '@n8n/typeorm';
import { AgentExecutionThread } from './agent-execution-thread.entity';
import { AgentExecution } from './agent-execution.entity';
import { AgentMessageEntity } from './agent-message.entity';
import type { AgentQueueDispatch } from '../types/agent-queued-message';
export declare class AgentMessageQueue extends WithTimestamps {
    id: string;
    position: number;
    thread: Relation<AgentExecutionThread>;
    threadId: string;
    message: Relation<AgentMessageEntity>;
    messageId: string;
    payload: AgentQueueDispatch;
    execution: Relation<AgentExecution> | null;
    executionId: string | null;
    steeringExecution: Relation<AgentExecution> | null;
    steeringExecutionId: string | null;
    steeringOrder: number | null;
}
