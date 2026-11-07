import { z } from 'zod';
import type { JsonSchemaObject, Serializable } from '../types';
export declare const parseConst: (jsonSchema: JsonSchemaObject & {
    const: Serializable;
}) => z.ZodLiteral<z.Primitive>;
