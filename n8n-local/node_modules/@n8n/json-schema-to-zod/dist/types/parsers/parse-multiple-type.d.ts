import { z } from 'zod';
import type { JsonSchemaObject, Refs } from '../types';
export declare const parseMultipleType: (jsonSchema: JsonSchemaObject & {
    type: string[];
}, refs: Refs) => z.ZodUnion<[z.ZodTypeAny, z.ZodTypeAny]>;
