import { z } from 'zod';
declare const UpdateApiKeyRequestDto_base: import("../../zod-class").ZodClass<{
    label: string;
    scopes: import("@n8n/permissions").ApiKeyScope[];
}, {
    label: z.ZodEffects<z.ZodString, string, string>;
    scopes: z.ZodEffects<z.ZodArray<z.ZodString, "many">, import("@n8n/permissions").ApiKeyScope[], string[]>;
}>;
export declare class UpdateApiKeyRequestDto extends UpdateApiKeyRequestDto_base {
}
export {};
