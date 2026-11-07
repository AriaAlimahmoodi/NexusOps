import { UserError } from 'n8n-workflow';
import { z } from 'zod';
export declare const AGENT_PLAN_FORMAT_VERSION = 1;
export declare class AgentPlanValidationError extends UserError {
}
export declare const agentPlanTaskSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    status: z.ZodEnum<["pending", "in_progress", "done", "failed", "cancelled"]>;
    dependsOn: z.ZodArray<z.ZodString, "many">;
    resultSummary: z.ZodOptional<z.ZodString>;
    startedAt: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    endedAt: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    kind: z.ZodLiteral<"task">;
    fallbackFor: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
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
}, {
    id: string;
    title: string;
    description: string;
    status: "cancelled" | "done" | "failed" | "in_progress" | "pending";
    dependsOn: string[];
    resultSummary?: string | undefined;
    startedAt?: string | null | undefined;
    endedAt?: string | null | undefined;
    kind: "task";
    fallbackFor?: string | undefined;
}>;
export declare const agentPlanGroupSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    status: z.ZodEnum<["pending", "in_progress", "done", "failed", "cancelled"]>;
    dependsOn: z.ZodArray<z.ZodString, "many">;
    resultSummary: z.ZodOptional<z.ZodString>;
    startedAt: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    endedAt: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    kind: z.ZodLiteral<"group">;
    tasks: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        description: z.ZodString;
        status: z.ZodEnum<["pending", "in_progress", "done", "failed", "cancelled"]>;
        dependsOn: z.ZodArray<z.ZodString, "many">;
        resultSummary: z.ZodOptional<z.ZodString>;
        startedAt: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        endedAt: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        kind: z.ZodLiteral<"task">;
        fallbackFor: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
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
    }, {
        id: string;
        title: string;
        description: string;
        status: "cancelled" | "done" | "failed" | "in_progress" | "pending";
        dependsOn: string[];
        resultSummary?: string | undefined;
        startedAt?: string | null | undefined;
        endedAt?: string | null | undefined;
        kind: "task";
        fallbackFor?: string | undefined;
    }>, "many">;
}, "strict", z.ZodTypeAny, {
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
}, {
    id: string;
    title: string;
    description: string;
    status: "cancelled" | "done" | "failed" | "in_progress" | "pending";
    dependsOn: string[];
    resultSummary?: string | undefined;
    startedAt?: string | null | undefined;
    endedAt?: string | null | undefined;
    kind: "group";
    tasks: {
        id: string;
        title: string;
        description: string;
        status: "cancelled" | "done" | "failed" | "in_progress" | "pending";
        dependsOn: string[];
        resultSummary?: string | undefined;
        startedAt?: string | null | undefined;
        endedAt?: string | null | undefined;
        kind: "task";
        fallbackFor?: string | undefined;
    }[];
}>;
export declare const agentPlanDocumentSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    presentation: z.ZodOptional<z.ZodObject<{
        label: z.ZodString;
        detail: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        label: string;
        detail?: string | undefined;
    }, {
        label: string;
        detail?: string | undefined;
    }>>;
    items: z.ZodArray<z.ZodDiscriminatedUnion<"kind", [z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        description: z.ZodString;
        status: z.ZodEnum<["pending", "in_progress", "done", "failed", "cancelled"]>;
        dependsOn: z.ZodArray<z.ZodString, "many">;
        resultSummary: z.ZodOptional<z.ZodString>;
        startedAt: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        endedAt: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        kind: z.ZodLiteral<"task">;
        fallbackFor: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
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
    }, {
        id: string;
        title: string;
        description: string;
        status: "cancelled" | "done" | "failed" | "in_progress" | "pending";
        dependsOn: string[];
        resultSummary?: string | undefined;
        startedAt?: string | null | undefined;
        endedAt?: string | null | undefined;
        kind: "task";
        fallbackFor?: string | undefined;
    }>, z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        description: z.ZodString;
        status: z.ZodEnum<["pending", "in_progress", "done", "failed", "cancelled"]>;
        dependsOn: z.ZodArray<z.ZodString, "many">;
        resultSummary: z.ZodOptional<z.ZodString>;
        startedAt: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        endedAt: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        kind: z.ZodLiteral<"group">;
        tasks: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            title: z.ZodString;
            description: z.ZodString;
            status: z.ZodEnum<["pending", "in_progress", "done", "failed", "cancelled"]>;
            dependsOn: z.ZodArray<z.ZodString, "many">;
            resultSummary: z.ZodOptional<z.ZodString>;
            startedAt: z.ZodDefault<z.ZodNullable<z.ZodString>>;
            endedAt: z.ZodDefault<z.ZodNullable<z.ZodString>>;
            kind: z.ZodLiteral<"task">;
            fallbackFor: z.ZodOptional<z.ZodString>;
        }, "strict", z.ZodTypeAny, {
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
        }, {
            id: string;
            title: string;
            description: string;
            status: "cancelled" | "done" | "failed" | "in_progress" | "pending";
            dependsOn: string[];
            resultSummary?: string | undefined;
            startedAt?: string | null | undefined;
            endedAt?: string | null | undefined;
            kind: "task";
            fallbackFor?: string | undefined;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
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
    }, {
        id: string;
        title: string;
        description: string;
        status: "cancelled" | "done" | "failed" | "in_progress" | "pending";
        dependsOn: string[];
        resultSummary?: string | undefined;
        startedAt?: string | null | undefined;
        endedAt?: string | null | undefined;
        kind: "group";
        tasks: {
            id: string;
            title: string;
            description: string;
            status: "cancelled" | "done" | "failed" | "in_progress" | "pending";
            dependsOn: string[];
            resultSummary?: string | undefined;
            startedAt?: string | null | undefined;
            endedAt?: string | null | undefined;
            kind: "task";
            fallbackFor?: string | undefined;
        }[];
    }>]>, "many">;
}, "strict", z.ZodTypeAny, {
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
}, {
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
        startedAt?: string | null | undefined;
        endedAt?: string | null | undefined;
        kind: "task";
        fallbackFor?: string | undefined;
    } | {
        id: string;
        title: string;
        description: string;
        status: "cancelled" | "done" | "failed" | "in_progress" | "pending";
        dependsOn: string[];
        resultSummary?: string | undefined;
        startedAt?: string | null | undefined;
        endedAt?: string | null | undefined;
        kind: "group";
        tasks: {
            id: string;
            title: string;
            description: string;
            status: "cancelled" | "done" | "failed" | "in_progress" | "pending";
            dependsOn: string[];
            resultSummary?: string | undefined;
            startedAt?: string | null | undefined;
            endedAt?: string | null | undefined;
            kind: "task";
            fallbackFor?: string | undefined;
        }[];
    })[];
}>;
export type AgentPlanDocument = z.infer<typeof agentPlanDocumentSchema>;
export type AgentPlanTask = z.infer<typeof agentPlanTaskSchema>;
export type AgentPlanGroup = z.infer<typeof agentPlanGroupSchema>;
export type AgentPlanItem = AgentPlanDocument['items'][number];
export type AgentPlanStatus = AgentPlanItem['status'];
export declare function parseAgentPlan(data: unknown, formatVersion: number): AgentPlanDocument;
