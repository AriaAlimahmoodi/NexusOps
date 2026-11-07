import { z } from 'zod';
export declare const serializedTagSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
}, "strict", z.ZodTypeAny, {
    id: string;
    name: string;
}, {
    id: string;
    name: string;
}>;
export type SerializedTag = z.infer<typeof serializedTagSchema>;
