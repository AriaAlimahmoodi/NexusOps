import { z } from 'zod';
declare const DeactivateWorkflowDto_base: import("../../zod-class").ZodClass<{
    expectedChecksum?: string | undefined;
}, {
    expectedChecksum: z.ZodOptional<z.ZodString>;
}>;
export declare class DeactivateWorkflowDto extends DeactivateWorkflowDto_base {
}
export {};
