import { z } from 'zod';
declare const UpdateAllowedRedirectUrisDto_base: import("@n8n/api-types").ZodClass<{
    uris: string[];
}, {
    uris: z.ZodEffects<z.ZodArray<z.ZodEffects<z.ZodString, string, string>, "many">, string[], unknown>;
}>;
export declare class UpdateAllowedRedirectUrisDto extends UpdateAllowedRedirectUrisDto_base {
}
export {};
