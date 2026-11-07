import { z } from 'zod';
declare const SamlToggleDto_base: import("../../zod-class").ZodClass<{
    loginEnabled: boolean;
}, {
    loginEnabled: z.ZodBoolean;
}>;
export declare class SamlToggleDto extends SamlToggleDto_base {
}
export {};
