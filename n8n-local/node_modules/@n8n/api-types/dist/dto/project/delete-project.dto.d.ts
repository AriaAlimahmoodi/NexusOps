import { z } from 'zod';
declare const DeleteProjectDto_base: import("../../zod-class").ZodClass<{
    transferId?: string | undefined;
}, {
    transferId: z.ZodOptional<z.ZodString>;
}>;
export declare class DeleteProjectDto extends DeleteProjectDto_base {
}
export {};
