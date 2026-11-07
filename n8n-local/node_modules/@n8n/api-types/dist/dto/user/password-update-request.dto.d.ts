import { z } from 'zod';
declare const PasswordUpdateRequestDto_base: import("../../zod-class").ZodClass<{
    currentPassword: string;
    newPassword: string;
    mfaCode?: string | undefined;
}, {
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
    mfaCode: z.ZodOptional<z.ZodString>;
}>;
export declare class PasswordUpdateRequestDto extends PasswordUpdateRequestDto_base {
}
export {};
