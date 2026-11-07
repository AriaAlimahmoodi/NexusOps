import { Project, User, WithTimestampsAndStringId } from '@n8n/db';
import { type Relation } from '@n8n/typeorm';
import { AgentHistory } from './agent-history.entity';
import { Agent } from './agent.entity';
export declare class AgentExecutionThread extends WithTimestampsAndStringId {
    owner: Relation<User> | null;
    ownerId: string | null;
    accessScope: 'user' | 'project';
    agent: Agent;
    agentId: string;
    agentName: string;
    title: string | null;
    emoji: string | null;
    parentThreadId: string | null;
    parentAgentId: string | null;
    project: Project;
    projectId: string;
    taskId: string | null;
    taskVersion: AgentHistory | null;
    taskVersionId: string | null;
    sessionNumber: number;
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalCost: number;
    totalDuration: number;
}
export type AgentThreadAccess = Pick<AgentExecutionThread, 'ownerId' | 'accessScope'>;
