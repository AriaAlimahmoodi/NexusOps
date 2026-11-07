import { z } from 'zod';
import type { JsonSchemaObject, JsonSchema, Refs } from '../types';
export declare const parseIfThenElse: (jsonSchema: JsonSchemaObject & {
    if: JsonSchema;
    then: JsonSchema;
    else: JsonSchema;
}, refs: Refs) => z.ZodEffects<z.ZodUnion<[z.ZodTypeAny, z.ZodTypeAny]>, any, any>;
