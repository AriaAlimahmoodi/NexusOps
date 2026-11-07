import { z } from 'zod';
declare const SettingsUpdateRequestDto_base: import("../../zod-class").ZodClass<{
    userActivated?: boolean | undefined;
    allowSSOManualLogin?: boolean | undefined;
    easyAIWorkflowOnboarded?: boolean | undefined;
    dismissedCallouts?: Record<string, boolean> | undefined;
}, {
    userActivated: z.ZodOptional<z.ZodBoolean>;
    allowSSOManualLogin: z.ZodOptional<z.ZodBoolean>;
    easyAIWorkflowOnboarded: z.ZodOptional<z.ZodBoolean>;
    dismissedCallouts: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodBoolean>>;
}>;
export declare class SettingsUpdateRequestDto extends SettingsUpdateRequestDto_base {
}
export {};
