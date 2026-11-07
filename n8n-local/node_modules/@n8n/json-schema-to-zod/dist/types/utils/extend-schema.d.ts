import type { z } from 'zod';
import type { JsonSchemaObject } from '../types';
export declare function extendSchemaWithMessage<TZod extends z.ZodTypeAny, TJson extends JsonSchemaObject, TKey extends keyof TJson>(zodSchema: TZod, jsonSchema: TJson, key: TKey, extend: (zodSchema: TZod, value: NonNullable<TJson[TKey]>, errorMessage?: string) => TZod): TZod;
