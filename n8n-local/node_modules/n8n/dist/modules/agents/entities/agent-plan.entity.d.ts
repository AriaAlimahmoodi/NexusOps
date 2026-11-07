import { WithTimestamps } from '@n8n/db';
import { type Relation } from '@n8n/typeorm';
import type { JsonObject } from 'n8n-workflow';
import type { AgentExecutionThread } from './agent-execution-thread.entity';
export declare class AgentPlan extends WithTimestamps {
    id: string;
    threadId: string;
    thread: Relation<AgentExecutionThread>;
    revision: number;
    formatVersion: number;
    data: JsonObject;
    closedAt: Date | null;
}
