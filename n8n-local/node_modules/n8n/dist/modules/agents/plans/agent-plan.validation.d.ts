import { type AgentPlanDocument, type AgentPlanStatus } from './agent-plan.schema';
export type AgentPlanReadiness = {
    ready: string[];
    blocked: Array<{
        id: string;
        blockedBy: string[];
    }>;
};
export declare const isFinal: (status: AgentPlanStatus) => status is "cancelled" | "done" | "failed";
export declare function getAgentPlanReadiness(document: AgentPlanDocument): AgentPlanReadiness;
export declare function prepareAgentPlan(data: unknown, formatVersion: number, previous: AgentPlanDocument | null, now: Date): AgentPlanDocument;
