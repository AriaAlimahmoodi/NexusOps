import type { SerializedCursor } from '@n8n/api-types';
import { z } from 'zod';
declare const Cursor: z.ZodObject<{
    version: z.ZodLiteral<1>;
    v1: z.ZodOptional<z.ZodObject<{
        timestamp: z.ZodString;
        id: z.ZodEffects<z.ZodString, string, string>;
    }, "strict", z.ZodTypeAny, {
        timestamp: string;
        id: string;
    }, {
        timestamp: string;
        id: string;
    }>>;
    v2: z.ZodOptional<z.ZodObject<{
        timestamp: z.ZodString;
        id: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        timestamp: string;
        id: string;
    }, {
        timestamp: string;
        id: string;
    }>>;
}, "strict", z.ZodTypeAny, {
    version: 1;
    v1?: {
        timestamp: string;
        id: string;
    } | undefined;
    v2?: {
        timestamp: string;
        id: string;
    } | undefined;
}, {
    version: 1;
    v1?: {
        timestamp: string;
        id: string;
    } | undefined;
    v2?: {
        timestamp: string;
        id: string;
    } | undefined;
}>;
export type ExecutionCursor = z.infer<typeof Cursor>;
export type ExecutionPosition = NonNullable<ExecutionCursor['v1']>;
export declare function parseExecutionCursor(value?: string): ExecutionCursor;
export declare function hasPosition(cursor?: ExecutionCursor): boolean;
export declare function encodeExecutionCursor(cursor: ExecutionCursor): SerializedCursor;
export {};
