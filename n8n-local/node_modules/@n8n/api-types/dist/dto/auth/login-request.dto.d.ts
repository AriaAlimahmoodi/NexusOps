import { z } from 'zod';
declare const LoginRequestDto_base: import("../../zod-class").ZodClass<{
    emailOrLdapLoginId: string;
    password: string;
    mfaCode?: string | undefined;
    mfaRecoveryCode?: string | undefined;
}, {
    emailOrLdapLoginId: z.ZodString;
    password: z.ZodString;
    mfaCode: z.ZodOptional<z.ZodString>;
    mfaRecoveryCode: z.ZodOptional<z.ZodString>;
}>;
export declare class LoginRequestDto extends LoginRequestDto_base {
}
export {};
