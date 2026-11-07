import { z } from 'zod';
declare const WorkflowHistoryVersionsByIdsDto_base: import("../../zod-class").ZodClass<{
    versionIds: string[];
}, {
    versionIds: z.ZodArray<z.ZodString, "many">;
}>;
export declare class WorkflowHistoryVersionsByIdsDto extends WorkflowHistoryVersionsByIdsDto_base {
}
export {};
