import { z } from 'zod';
declare const AddFavoriteDto_base: import("@n8n/api-types").ZodClass<{
    resourceId: string;
    resourceType: "agent" | "dataTable" | "folder" | "project" | "workflow";
}, {
    resourceId: z.ZodString;
    resourceType: z.ZodEnum<["workflow", "project", "dataTable", "folder", "agent"]>;
}>;
export declare class AddFavoriteDto extends AddFavoriteDto_base {
}
export {};
