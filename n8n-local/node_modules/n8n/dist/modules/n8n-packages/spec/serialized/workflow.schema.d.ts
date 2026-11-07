import { z } from 'zod';
export declare const serializedWorkflowSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    nodes: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        type: z.ZodString;
        typeVersion: z.ZodNumber;
        position: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
        parameters: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
            id: z.ZodNullable<z.ZodString>;
            name: z.ZodString;
            __aiGatewayManaged: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            id: string | null;
            name: string;
            __aiGatewayManaged?: boolean | undefined;
        }, {
            id: string | null;
            name: string;
            __aiGatewayManaged?: boolean | undefined;
        }>>>;
        disabled: z.ZodOptional<z.ZodBoolean>;
        notes: z.ZodOptional<z.ZodString>;
        notesInFlow: z.ZodOptional<z.ZodBoolean>;
        continueOnFail: z.ZodOptional<z.ZodBoolean>;
        retryOnFail: z.ZodOptional<z.ZodBoolean>;
        maxTries: z.ZodOptional<z.ZodNumber>;
        waitBetweenTries: z.ZodOptional<z.ZodNumber>;
        alwaysOutputData: z.ZodOptional<z.ZodBoolean>;
        executeOnce: z.ZodOptional<z.ZodBoolean>;
        onError: z.ZodOptional<z.ZodString>;
        webhookId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        type: string;
        typeVersion: number;
        position: [number, number];
        parameters: Record<string, unknown>;
        credentials?: Record<string, {
            id: string | null;
            name: string;
            __aiGatewayManaged?: boolean | undefined;
        }> | undefined;
        disabled?: boolean | undefined;
        notes?: string | undefined;
        notesInFlow?: boolean | undefined;
        continueOnFail?: boolean | undefined;
        retryOnFail?: boolean | undefined;
        maxTries?: number | undefined;
        waitBetweenTries?: number | undefined;
        alwaysOutputData?: boolean | undefined;
        executeOnce?: boolean | undefined;
        onError?: string | undefined;
        webhookId?: string | undefined;
    }, {
        id: string;
        name: string;
        type: string;
        typeVersion: number;
        position: [number, number];
        parameters: Record<string, unknown>;
        credentials?: Record<string, {
            id: string | null;
            name: string;
            __aiGatewayManaged?: boolean | undefined;
        }> | undefined;
        disabled?: boolean | undefined;
        notes?: string | undefined;
        notesInFlow?: boolean | undefined;
        continueOnFail?: boolean | undefined;
        retryOnFail?: boolean | undefined;
        maxTries?: number | undefined;
        waitBetweenTries?: number | undefined;
        alwaysOutputData?: boolean | undefined;
        executeOnce?: boolean | undefined;
        onError?: string | undefined;
        webhookId?: string | undefined;
    }>, "many">;
    connections: z.ZodRecord<z.ZodString, z.ZodRecord<z.ZodString, z.ZodArray<z.ZodNullable<z.ZodArray<z.ZodObject<{
        node: z.ZodString;
        type: z.ZodString;
        index: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        node: string;
        type: string;
        index: number;
    }, {
        node: string;
        type: string;
        index: number;
    }>, "many">>, "many">>>;
    nodeGroups: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        nodeIds: z.ZodArray<z.ZodString, "many">;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        nodeIds: string[];
        description?: string | undefined;
    }, {
        id: string;
        name: string;
        nodeIds: string[];
        description?: string | undefined;
    }>, "many">>;
    settings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    parentFolderId: z.ZodNullable<z.ZodString>;
    isArchived: z.ZodBoolean;
    tagIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    nodes: {
        id: string;
        name: string;
        type: string;
        typeVersion: number;
        position: [number, number];
        parameters: Record<string, unknown>;
        credentials?: Record<string, {
            id: string | null;
            name: string;
            __aiGatewayManaged?: boolean | undefined;
        }> | undefined;
        disabled?: boolean | undefined;
        notes?: string | undefined;
        notesInFlow?: boolean | undefined;
        continueOnFail?: boolean | undefined;
        retryOnFail?: boolean | undefined;
        maxTries?: number | undefined;
        waitBetweenTries?: number | undefined;
        alwaysOutputData?: boolean | undefined;
        executeOnce?: boolean | undefined;
        onError?: string | undefined;
        webhookId?: string | undefined;
    }[];
    connections: Record<string, Record<string, ({
        node: string;
        type: string;
        index: number;
    }[] | null)[]>>;
    nodeGroups?: {
        id: string;
        name: string;
        nodeIds: string[];
        description?: string | undefined;
    }[] | undefined;
    settings?: Record<string, unknown> | undefined;
    parentFolderId: string | null;
    isArchived: boolean;
    tagIds?: string[] | undefined;
}, {
    id: string;
    name: string;
    nodes: {
        id: string;
        name: string;
        type: string;
        typeVersion: number;
        position: [number, number];
        parameters: Record<string, unknown>;
        credentials?: Record<string, {
            id: string | null;
            name: string;
            __aiGatewayManaged?: boolean | undefined;
        }> | undefined;
        disabled?: boolean | undefined;
        notes?: string | undefined;
        notesInFlow?: boolean | undefined;
        continueOnFail?: boolean | undefined;
        retryOnFail?: boolean | undefined;
        maxTries?: number | undefined;
        waitBetweenTries?: number | undefined;
        alwaysOutputData?: boolean | undefined;
        executeOnce?: boolean | undefined;
        onError?: string | undefined;
        webhookId?: string | undefined;
    }[];
    connections: Record<string, Record<string, ({
        node: string;
        type: string;
        index: number;
    }[] | null)[]>>;
    nodeGroups?: {
        id: string;
        name: string;
        nodeIds: string[];
        description?: string | undefined;
    }[] | undefined;
    settings?: Record<string, unknown> | undefined;
    parentFolderId: string | null;
    isArchived: boolean;
    tagIds?: string[] | undefined;
}>;
export type SerializedWorkflow = z.infer<typeof serializedWorkflowSchema>;
