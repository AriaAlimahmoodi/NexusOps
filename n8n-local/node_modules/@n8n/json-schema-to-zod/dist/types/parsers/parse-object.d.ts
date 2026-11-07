import * as z from 'zod';
import type { JsonSchemaObject, Refs } from '../types';
export declare function parseObject(objectSchema: JsonSchemaObject & {
    type: 'object';
}, refs: Refs): z.ZodTypeAny;
