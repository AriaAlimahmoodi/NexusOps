import type { z } from 'zod';
import type { JsonSchemaToZodOptions, JsonSchema } from './types';
export declare const jsonSchemaToZod: <T extends z.ZodTypeAny = z.ZodTypeAny>(schema: JsonSchema, options?: JsonSchemaToZodOptions) => T;
