import { z } from 'zod';
declare const AiSessionRetrievalRequestDto_base: import("../../zod-class").ZodClass<{
    workflowId?: string | undefined;
    codeBuilder?: boolean | undefined;
}, {
    workflowId: z.ZodOptional<z.ZodString>;
    codeBuilder: z.ZodOptional<z.ZodBoolean>;
}>;
export declare class AiSessionRetrievalRequestDto extends AiSessionRetrievalRequestDto_base {
}
export {};
