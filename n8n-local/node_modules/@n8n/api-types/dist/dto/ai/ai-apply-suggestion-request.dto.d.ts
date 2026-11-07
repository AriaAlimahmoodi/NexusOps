import { z } from 'zod';
declare const AiApplySuggestionRequestDto_base: import("../../zod-class").ZodClass<{
    sessionId: string;
    suggestionId: string;
}, {
    sessionId: z.ZodString;
    suggestionId: z.ZodString;
}>;
export declare class AiApplySuggestionRequestDto extends AiApplySuggestionRequestDto_base {
}
export {};
