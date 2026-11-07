import { z } from 'zod';
declare const ApproveConsentRequestDto_base: import("@n8n/api-types").ZodClass<{
    approved: boolean;
    scopes?: string[] | undefined;
    flow: string;
}, {
    approved: z.ZodBoolean;
    scopes: z.ZodOptional<z.ZodEffects<z.ZodArray<z.ZodString, "many">, string[], string[]>>;
    flow: z.ZodString;
}>;
export declare class ApproveConsentRequestDto extends ApproveConsentRequestDto_base {
}
export {};
