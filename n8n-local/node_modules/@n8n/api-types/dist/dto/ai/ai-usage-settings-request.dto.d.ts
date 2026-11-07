import { z } from 'zod';
declare const AiUsageSettingsRequestDto_base: import("../../zod-class").ZodClass<{
    allowSendingParameterValues: boolean;
}, {
    allowSendingParameterValues: z.ZodBoolean;
}>;
export declare class AiUsageSettingsRequestDto extends AiUsageSettingsRequestDto_base {
}
export {};
