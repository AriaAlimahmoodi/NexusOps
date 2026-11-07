import { z } from 'zod';
declare const TransferWorkflowBodyDto_base: import("../../zod-class").ZodClass<{
    destinationProjectId: string;
    shareCredentials?: string[] | undefined;
    destinationParentFolderId?: string | undefined;
}, {
    destinationProjectId: z.ZodString;
    shareCredentials: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    destinationParentFolderId: z.ZodOptional<z.ZodString>;
}>;
export declare class TransferWorkflowBodyDto extends TransferWorkflowBodyDto_base {
}
export {};
