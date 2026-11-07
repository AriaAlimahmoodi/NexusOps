import { z } from 'zod';
export declare const valueLookupPathSchema: z.ZodObject<{
    nodeType: z.ZodString;
    path: z.ZodString;
}, "strip", z.ZodTypeAny, {
    nodeType: string;
    path: string;
}, {
    nodeType: string;
    path: string;
}>;
export type ValueLookupPath = z.infer<typeof valueLookupPathSchema>;
export declare const sensitiveFieldRulesSchema: z.ZodRecord<z.ZodString, z.ZodObject<{
    nodeType: z.ZodString;
    path: z.ZodString;
}, "strip", z.ZodTypeAny, {
    nodeType: string;
    path: string;
}, {
    nodeType: string;
    path: string;
}>>;
export type SensitiveFieldRules = z.infer<typeof sensitiveFieldRulesSchema>;
