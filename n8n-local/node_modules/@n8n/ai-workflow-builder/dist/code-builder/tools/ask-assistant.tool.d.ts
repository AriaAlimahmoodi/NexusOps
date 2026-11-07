import { z } from 'zod';
export declare const ASK_ASSISTANT_TOOL: {
    name: string;
    description: string;
    schema: z.ZodObject<{
        query: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        query: string;
    }, {
        query: string;
    }>;
};
