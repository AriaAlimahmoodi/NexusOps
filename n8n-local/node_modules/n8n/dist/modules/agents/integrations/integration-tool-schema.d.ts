import { z } from 'zod';
import type { IntegrationAction, IntegrationActionDefinition, IntegrationContextQuery, IntegrationContextQueryDefinition } from './integration-tool-types';
export interface RawContextToolOperation {
    query: IntegrationContextQuery;
    input: Record<string, unknown>;
}
export type RawContextToolInput = {
    query?: IntegrationContextQuery;
    input?: Record<string, unknown>;
    queries?: RawContextToolOperation[];
};
export interface RawActionToolOperation {
    action: IntegrationAction;
    input: Record<string, unknown>;
}
export type RawActionToolInput = {
    action?: IntegrationAction;
    input?: Record<string, unknown>;
    actions?: Array<{
        action: IntegrationAction;
        input?: Record<string, unknown>;
    }>;
};
export declare const MAX_BATCH_OPERATIONS = 20;
export declare function buildContextInputSchema(definitions: IntegrationContextQueryDefinition[]): z.ZodEffects<z.ZodObject<{
    query: z.ZodOptional<z.ZodEnum<[IntegrationContextQuery, ...IntegrationContextQuery[]]>>;
    input: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    queries: z.ZodOptional<z.ZodArray<z.ZodObject<{
        query: z.ZodEnum<[IntegrationContextQuery, ...IntegrationContextQuery[]]>;
        input: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strict", z.ZodTypeAny, {
        query: IntegrationContextQuery;
        input?: Record<string, unknown> | undefined;
    }, {
        query: IntegrationContextQuery;
        input?: Record<string, unknown> | undefined;
    }>, "many">>;
}, "strict", z.ZodTypeAny, {
    query?: IntegrationContextQuery | undefined;
    input?: Record<string, unknown> | undefined;
    queries?: {
        query: IntegrationContextQuery;
        input?: Record<string, unknown> | undefined;
    }[] | undefined;
}, {
    query?: IntegrationContextQuery | undefined;
    input?: Record<string, unknown> | undefined;
    queries?: {
        query: IntegrationContextQuery;
        input?: Record<string, unknown> | undefined;
    }[] | undefined;
}>, {
    query?: IntegrationContextQuery | undefined;
    input?: Record<string, unknown> | undefined;
    queries?: {
        query: IntegrationContextQuery;
        input?: Record<string, unknown> | undefined;
    }[] | undefined;
}, {
    query?: IntegrationContextQuery | undefined;
    input?: Record<string, unknown> | undefined;
    queries?: {
        query: IntegrationContextQuery;
        input?: Record<string, unknown> | undefined;
    }[] | undefined;
}>;
export declare function buildActionInputSchema(definitions: IntegrationActionDefinition[]): z.ZodEffects<z.ZodObject<{
    action: z.ZodOptional<z.ZodEnum<[IntegrationAction, ...IntegrationAction[]]>>;
    input: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    actions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        action: z.ZodEnum<[IntegrationAction, ...IntegrationAction[]]>;
        input: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strict", z.ZodTypeAny, {
        action: IntegrationAction;
        input?: Record<string, unknown> | undefined;
    }, {
        action: IntegrationAction;
        input?: Record<string, unknown> | undefined;
    }>, "many">>;
}, "strict", z.ZodTypeAny, {
    action?: IntegrationAction | undefined;
    input?: Record<string, unknown> | undefined;
    actions?: {
        action: IntegrationAction;
        input?: Record<string, unknown> | undefined;
    }[] | undefined;
}, {
    action?: IntegrationAction | undefined;
    input?: Record<string, unknown> | undefined;
    actions?: {
        action: IntegrationAction;
        input?: Record<string, unknown> | undefined;
    }[] | undefined;
}>, {
    action?: IntegrationAction | undefined;
    input?: Record<string, unknown> | undefined;
    actions?: {
        action: IntegrationAction;
        input?: Record<string, unknown> | undefined;
    }[] | undefined;
}, {
    action?: IntegrationAction | undefined;
    input?: Record<string, unknown> | undefined;
    actions?: {
        action: IntegrationAction;
        input?: Record<string, unknown> | undefined;
    }[] | undefined;
}>;
export declare function toSingleContextOperation(input: RawContextToolInput): RawContextToolOperation;
export declare function toSingleActionOperation(input: RawActionToolInput): RawActionToolOperation;
