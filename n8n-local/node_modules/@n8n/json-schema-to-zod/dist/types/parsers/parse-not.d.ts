import { z } from 'zod';
import type { JsonSchemaObject, JsonSchema, Refs } from '../types';
export declare const parseNot: (jsonSchema: JsonSchemaObject & {
    not: JsonSchema;
}, refs: Refs) => z.ZodEffects<z.ZodAny, any, any>;
