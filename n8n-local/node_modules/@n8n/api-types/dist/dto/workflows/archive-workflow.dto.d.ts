import { z } from 'zod';
declare const ArchiveWorkflowDto_base: import("../../zod-class").ZodClass<{
    expectedChecksum?: string | undefined;
}, {
    expectedChecksum: z.ZodOptional<z.ZodString>;
}>;
export declare class ArchiveWorkflowDto extends ArchiveWorkflowDto_base {
}
export {};
