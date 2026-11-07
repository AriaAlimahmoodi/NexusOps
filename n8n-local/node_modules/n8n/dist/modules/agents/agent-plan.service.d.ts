import type { OperationContext } from '@n8n/db';
import { type AgentPlanDocument } from './plans/agent-plan.schema';
import { type AgentPlanReadiness } from './plans/agent-plan.validation';
import { AgentPlanRepository, type AgentPlanRecord, type AgentPlanRevision } from './repositories/agent-plan.repository';
type PlanDocumentInput = {
    data: unknown;
    formatVersion: number;
};
type PlanWrite = {
    threadId: string;
    planId: string;
    expectedRevision: number;
};
export type AgentPlanSnapshot = Omit<AgentPlanRecord, 'data'> & {
    data: AgentPlanDocument;
    readiness: AgentPlanReadiness;
};
export declare class AgentPlanService {
    private readonly repository;
    constructor(repository: AgentPlanRepository);
    createActivePlan(input: PlanDocumentInput & {
        id: string;
        threadId: string;
    }, ctx: OperationContext): Promise<AgentPlanRecord & {
        data: {
            title: string;
            description: string;
            presentation?: {
                label: string;
                detail?: string | undefined;
            } | undefined;
            items: ({
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
        };
        readiness: AgentPlanReadiness;
    }>;
    findActivePlan(threadId: string, ctx: OperationContext): Promise<AgentPlanSnapshot | null>;
    findPlan(threadId: string, planId: string, ctx: OperationContext): Promise<(AgentPlanRecord & {
        data: {
            title: string;
            description: string;
            presentation?: {
                label: string;
                detail?: string | undefined;
            } | undefined;
            items: ({
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
        };
        readiness: AgentPlanReadiness;
    }) | null>;
    findRevision(threadId: string, planId: string, revision: number, ctx: OperationContext): Promise<(AgentPlanRevision & {
        data: {
            title: string;
            description: string;
            presentation?: {
                label: string;
                detail?: string | undefined;
            } | undefined;
            items: ({
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
        };
        readiness: AgentPlanReadiness;
    }) | null>;
    listHistory(threadId: string, planId: string, options: {
        afterRevision?: number;
        limit?: number;
    }, ctx: OperationContext): Promise<{
        items: import("./repositories/agent-plan.repository").AgentPlanRevisionMetadata[];
        nextCursor: number | null;
    }>;
    replacePlan(input: PlanWrite & PlanDocumentInput, ctx: OperationContext): Promise<AgentPlanRecord & {
        data: {
            title: string;
            description: string;
            presentation?: {
                label: string;
                detail?: string | undefined;
            } | undefined;
            items: ({
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
        };
        readiness: AgentPlanReadiness;
    }>;
    closePlan(input: PlanWrite, ctx: OperationContext): Promise<AgentPlanRecord & {
        data: {
            title: string;
            description: string;
            presentation?: {
                label: string;
                detail?: string | undefined;
            } | undefined;
            items: ({
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
        };
        readiness: AgentPlanReadiness;
    }>;
    private loadForWrite;
    private decode;
}
export {};
