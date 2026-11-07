import { z } from 'zod';
import type { JsonSchemaObject, JsonSchema, Refs } from '../types';
export declare function parseAllOf(jsonSchema: JsonSchemaObject & {
    allOf: JsonSchema[];
}, refs: Refs): z.ZodTypeAny;
