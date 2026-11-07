import { z } from 'zod';
declare const CreateApiKeyRequestDto_base: import("../..").ZodClass<{
    label: string;
    scopes: import("@n8n/permissions").ApiKeyScope[];
} & {
    expiresAt: number | null;
}, {
    label: z.ZodEffects<z.ZodString, string, string>;
    scopes: z.ZodEffects<z.ZodArray<z.ZodString, "many">, import("@n8n/permissions").ApiKeyScope[], string[]>;
} & {
    expiresAt: z.ZodEffects<z.ZodNullable<z.ZodNumber>, number | null, number | null>;
}>;
export declare class CreateApiKeyRequestDto extends CreateApiKeyRequestDto_base {
}
export {};
