import { WithCreatedAt } from '@n8n/db';
import { type Relation } from '@n8n/typeorm';
import type { JsonObject } from 'n8n-workflow';
import type { AgentPlan } from './agent-plan.entity';
export declare class AgentPlanHistory extends WithCreatedAt {
    planId: string;
    plan: Relation<AgentPlan>;
    revision: number;
    formatVersion: number;
    data: JsonObject;
    closedAt: Date | null;
}
