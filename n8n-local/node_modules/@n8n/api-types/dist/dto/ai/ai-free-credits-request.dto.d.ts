import { z } from 'zod';
declare const AiFreeCreditsRequestDto_base: import("../../zod-class").ZodClass<{
    projectId?: string | undefined;
}, {
    projectId: z.ZodOptional<z.ZodString>;
}>;
export declare class AiFreeCreditsRequestDto extends AiFreeCreditsRequestDto_base {
}
export {};
