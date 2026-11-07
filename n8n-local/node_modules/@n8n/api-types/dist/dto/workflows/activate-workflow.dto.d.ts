import { z } from 'zod';
declare const ActivateWorkflowDto_base: import("../../zod-class").ZodClass<{
    versionId: string;
    name?: string | undefined;
    description?: string | undefined;
    expectedChecksum?: string | undefined;
}, {
    versionId: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    expectedChecksum: z.ZodOptional<z.ZodString>;
}>;
export declare class ActivateWorkflowDto extends ActivateWorkflowDto_base {
}
export {};
