import { z } from 'zod';
export declare const BUILD_WORKFLOW_TOOL: {
    name: string;
    description: string;
    schema: z.ZodObject<{
        instructions: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        instructions: string;
    }, {
        instructions: string;
    }>;
};
