import { z } from 'zod';
declare const UpdateCredentialResolverDto_base: import("../../zod-class").ZodClass<{
    type?: string | undefined;
    name?: string | undefined;
    config?: Record<string, unknown> | undefined;
    clearCredentials?: boolean | undefined;
}, {
    type: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    config: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    clearCredentials: z.ZodOptional<z.ZodBoolean>;
}>;
export declare class UpdateCredentialResolverDto extends UpdateCredentialResolverDto_base {
}
export {};
