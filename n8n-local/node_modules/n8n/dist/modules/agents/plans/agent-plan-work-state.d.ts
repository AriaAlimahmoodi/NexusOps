import type { AgentPlanDocument } from './agent-plan.schema';
export declare function planLeaves(document: AgentPlanDocument): ({
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
} | {
    id: string;
    title: string;
    description: string;
    status: "cancelled" | "done" | "failed" | "in_progress" | "pending";
    dependsOn: string[];
    resultSummary?: string | undefined;
    startedAt: string | null;
    endedAt: string | null;
    kind: "group";
    tasks: {
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
    }[];
})[];
export declare function unfinishedPlanIds(document: AgentPlanDocument): string[];
