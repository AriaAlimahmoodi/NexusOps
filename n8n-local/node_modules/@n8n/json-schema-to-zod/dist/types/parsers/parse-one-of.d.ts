import { z } from 'zod';
import type { JsonSchemaObject, JsonSchema, Refs } from '../types';
export declare const parseOneOf: (jsonSchema: JsonSchemaObject & {
    oneOf: JsonSchema[];
}, refs: Refs) => z.ZodTypeAny;
