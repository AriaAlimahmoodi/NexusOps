import { z } from 'zod';
declare const ChangePasswordRequestDto_base: import("../../zod-class").ZodClass<{
    token: string;
    password: string;
    mfaCode?: string | undefined;
}, {
    token: z.ZodString;
    password: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
    mfaCode: z.ZodOptional<z.ZodString>;
}>;
export declare class ChangePasswordRequestDto extends ChangePasswordRequestDto_base {
}
export {};
