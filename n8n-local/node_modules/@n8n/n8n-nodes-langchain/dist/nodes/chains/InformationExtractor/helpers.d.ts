import { z } from 'zod';
import type { AttributeDefinition } from './types';
export declare function makeZodSchemaFromAttributes(attributes: AttributeDefinition[]): z.ZodObject<any, "strip", z.ZodTypeAny, {
    [x: string]: any;
}, {
    [x: string]: any;
}>;
