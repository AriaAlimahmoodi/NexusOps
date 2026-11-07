import type { JsonSchemaObject, Refs } from '../types';
/**
 * For compatibility with open api 3.0 nullable
 */
export declare const parseNullable: (jsonSchema: JsonSchemaObject & {
    nullable: true;
}, refs: Refs) => import("zod").ZodNullable<import("zod").ZodTypeAny>;
