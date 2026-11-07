import { WithCreatedAt } from '@n8n/db';
import type { Relation } from '@n8n/typeorm';
import { AgentExecution } from './agent-execution.entity';
import { AgentMessageEntity } from './agent-message.entity';
export declare class AgentExecutionMessageLink extends WithCreatedAt {
    executionId: string;
    messageId: string;
    direction: 'input' | 'output';
    position: number;
    execution: Relation<AgentExecution>;
    message: Relation<AgentMessageEntity>;
}
