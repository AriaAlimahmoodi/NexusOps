import { z } from 'zod';
declare const UpdateWorkflowsAvailabilityDto_base: import("@n8n/api-types").ZodClass<{
    availableInMCP: boolean;
    workflowIds?: string[] | undefined;
    projectId?: string | undefined;
    folderId?: string | undefined;
    allWorkflows?: true | undefined;
}, {
    availableInMCP: z.ZodBoolean;
    workflowIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    projectId: z.ZodOptional<z.ZodString>;
    folderId: z.ZodOptional<z.ZodString>;
    allWorkflows: z.ZodOptional<z.ZodLiteral<true>>;
}>;
export declare class UpdateWorkflowsAvailabilityDto extends UpdateWorkflowsAvailabilityDto_base {
}
export {};
