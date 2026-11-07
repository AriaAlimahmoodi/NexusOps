import { z } from 'zod';
import type { JsonSchemaObject, JsonSchema, Refs } from '../types';
export declare const parseAnyOf: (jsonSchema: JsonSchemaObject & {
    anyOf: JsonSchema[];
}, refs: Refs) => z.ZodTypeAny;
