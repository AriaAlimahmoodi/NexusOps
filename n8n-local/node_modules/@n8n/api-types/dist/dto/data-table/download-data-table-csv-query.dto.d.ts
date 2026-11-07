import { z } from 'zod';
declare const DownloadDataTableCsvQueryDto_base: import("../../zod-class").ZodClass<{
    includeSystemColumns: boolean;
}, {
    includeSystemColumns: z.ZodEffects<z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>, boolean, string | boolean | undefined>;
}>;
export declare class DownloadDataTableCsvQueryDto extends DownloadDataTableCsvQueryDto_base {
}
export {};
