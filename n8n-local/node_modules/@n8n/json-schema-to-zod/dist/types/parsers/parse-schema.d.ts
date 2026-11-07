import * as z from 'zod';
import type { Refs, JsonSchema } from '../types';
export declare const parseSchema: (jsonSchema: JsonSchema, refs?: Refs, blockMeta?: boolean) => z.ZodTypeAny;
