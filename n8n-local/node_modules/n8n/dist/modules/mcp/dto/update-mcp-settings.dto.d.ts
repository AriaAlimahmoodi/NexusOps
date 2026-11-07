import { z } from 'zod';
declare const updateMcpSettingsSchema: z.ZodEffects<z.ZodObject<{
    mcpAccessEnabled: z.ZodOptional<z.ZodBoolean>;
    autoExposeNewWorkflows: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    mcpAccessEnabled?: boolean | undefined;
    autoExposeNewWorkflows?: boolean | undefined;
}, {
    mcpAccessEnabled?: boolean | undefined;
    autoExposeNewWorkflows?: boolean | undefined;
}>, {
    mcpAccessEnabled?: boolean | undefined;
    autoExposeNewWorkflows?: boolean | undefined;
}, {
    mcpAccessEnabled?: boolean | undefined;
    autoExposeNewWorkflows?: boolean | undefined;
}>;
declare const UpdateMcpSettingsDto_base: import("@n8n/api-types").ZodClass<{
    mcpAccessEnabled?: boolean | undefined;
    autoExposeNewWorkflows?: boolean | undefined;
}, {
    mcpAccessEnabled: z.ZodOptional<z.ZodBoolean>;
    autoExposeNewWorkflows: z.ZodOptional<z.ZodBoolean>;
}>;
export declare class UpdateMcpSettingsDto extends UpdateMcpSettingsDto_base {
    constructor(data: z.infer<typeof updateMcpSettingsSchema>);
    static safeParse(data: unknown): z.SafeParseReturnType<{
        mcpAccessEnabled?: boolean | undefined;
        autoExposeNewWorkflows?: boolean | undefined;
    }, {
        mcpAccessEnabled?: boolean | undefined;
        autoExposeNewWorkflows?: boolean | undefined;
    }>;
    static parse(data: unknown): {
        mcpAccessEnabled?: boolean | undefined;
        autoExposeNewWorkflows?: boolean | undefined;
    };
}
export {};
