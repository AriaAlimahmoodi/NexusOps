import { z } from 'zod';
declare const McpDiscoveryVisitRequestDto_base: import("@n8n/api-types").ZodClass<{
    pickedClaude?: boolean | undefined;
    isTrial?: boolean | undefined;
}, {
    pickedClaude: z.ZodOptional<z.ZodBoolean>;
    isTrial: z.ZodOptional<z.ZodBoolean>;
}>;
export declare class McpDiscoveryVisitRequestDto extends McpDiscoveryVisitRequestDto_base {
}
export {};
