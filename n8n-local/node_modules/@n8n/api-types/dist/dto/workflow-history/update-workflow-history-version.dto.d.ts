import { z } from 'zod';
declare const UpdateWorkflowHistoryVersionDto_base: import("../../zod-class").ZodClass<{
    name?: string | null | undefined;
    description?: string | null | undefined;
}, {
    name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}>;
export declare class UpdateWorkflowHistoryVersionDto extends UpdateWorkflowHistoryVersionDto_base {
}
export {};
