import { z } from 'zod';
declare const ForgotPasswordRequestDto_base: import("../../zod-class").ZodClass<{
    email: string;
}, {
    email: z.ZodString;
}>;
export declare class ForgotPasswordRequestDto extends ForgotPasswordRequestDto_base {
}
export {};
