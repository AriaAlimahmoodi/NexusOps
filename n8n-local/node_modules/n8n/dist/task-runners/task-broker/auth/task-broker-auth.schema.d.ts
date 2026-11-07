import { z } from 'zod';
export declare const taskBrokerAuthRequestBodySchema: z.ZodObject<{
    token: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token: string;
}, {
    token: string;
}>;
export declare const bearerTokenSchema: z.ZodEffects<z.ZodString, string, string>;
