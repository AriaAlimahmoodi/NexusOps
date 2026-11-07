import { z } from 'zod';
declare const SamlAcsDto_base: import("../../zod-class").ZodClass<{
    RelayState?: string | undefined;
}, {
    RelayState: z.ZodOptional<z.ZodString>;
}>;
export declare class SamlAcsDto extends SamlAcsDto_base {
}
export {};
