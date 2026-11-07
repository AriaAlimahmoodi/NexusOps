import type { ICredentialDataDecryptedObject } from 'n8n-workflow';
import { z } from 'zod';
export declare const resolveCredentialRequestSchema: z.ZodObject<{
    credential: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        type: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        type: string;
    }, {
        id: string;
        name: string;
        type: string;
    }>;
    execution: z.ZodObject<{
        executionId: z.ZodString;
        workflowId: z.ZodString;
        mode: z.ZodEnum<["cli", "error", "integrated", "internal", "manual", "retry", "trigger", "webhook", "evaluation", "chat", "agent"]>;
    }, "strip", z.ZodTypeAny, {
        executionId: string;
        workflowId: string;
        mode: "agent" | "chat" | "cli" | "error" | "evaluation" | "integrated" | "internal" | "manual" | "retry" | "trigger" | "webhook";
    }, {
        executionId: string;
        workflowId: string;
        mode: "agent" | "chat" | "cli" | "error" | "evaluation" | "integrated" | "internal" | "manual" | "retry" | "trigger" | "webhook";
    }>;
    context: z.ZodObject<{
        userId: z.ZodOptional<z.ZodString>;
        projectId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        userId?: string | undefined;
        projectId?: string | undefined;
    }, {
        userId?: string | undefined;
        projectId?: string | undefined;
    }>;
    consumer: z.ZodObject<{
        nodeType: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        nodeType: string;
    }, {
        nodeType: string;
    }>;
}, "strip", z.ZodTypeAny, {
    credential: {
        id: string;
        name: string;
        type: string;
    };
    execution: {
        executionId: string;
        workflowId: string;
        mode: "agent" | "chat" | "cli" | "error" | "evaluation" | "integrated" | "internal" | "manual" | "retry" | "trigger" | "webhook";
    };
    context: {
        userId?: string | undefined;
        projectId?: string | undefined;
    };
    consumer: {
        nodeType: string;
    };
}, {
    credential: {
        id: string;
        name: string;
        type: string;
    };
    execution: {
        executionId: string;
        workflowId: string;
        mode: "agent" | "chat" | "cli" | "error" | "evaluation" | "integrated" | "internal" | "manual" | "retry" | "trigger" | "webhook";
    };
    context: {
        userId?: string | undefined;
        projectId?: string | undefined;
    };
    consumer: {
        nodeType: string;
    };
}>;
export type ResolveCredentialRequest = z.infer<typeof resolveCredentialRequestSchema>;
export interface ResolveCredentialResponse {
    data: ICredentialDataDecryptedObject;
}
export declare function isResolveCredentialResponse(body: unknown): body is ResolveCredentialResponse;
