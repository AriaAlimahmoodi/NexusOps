import type { BuiltTool } from '@n8n/agents';
import type { AgentPlanService, AgentPlanSnapshot } from '../agent-plan.service';
export declare function presentPlan(plan: AgentPlanSnapshot | null): {
    planId: string;
    revision: number;
    closed: boolean;
    startedAt: string;
    finishedAt: string | null;
    closedAt: string | null;
    document: {
        title: string;
        description: string;
        presentation?: {
            label: string;
            detail?: string | undefined;
        } | undefined;
        items: (Omit<{
            id: string;
            title: string;
            description: string;
            status: "cancelled" | "done" | "failed" | "in_progress" | "pending";
            dependsOn: string[];
            resultSummary?: string | undefined;
            startedAt: string | null;
            endedAt: string | null;
            kind: "task";
            fallbackFor?: string | undefined;
        }, "endedAt" | "startedAt"> | {
            id: string;
            title: string;
            description: string;
            status: "cancelled" | "done" | "failed" | "in_progress" | "pending";
            dependsOn: string[];
            resultSummary?: string | undefined;
            kind: "group";
            tasks: Omit<{
                id: string;
                title: string;
                description: string;
                status: "cancelled" | "done" | "failed" | "in_progress" | "pending";
                dependsOn: string[];
                resultSummary?: string | undefined;
                startedAt: string | null;
                endedAt: string | null;
                kind: "task";
                fallbackFor?: string | undefined;
            }, "endedAt" | "startedAt">[];
        })[];
    };
    readiness: import("./agent-plan.validation").AgentPlanReadiness;
} | null;
export declare function createAgentPlanTools(service: AgentPlanService): BuiltTool[];
