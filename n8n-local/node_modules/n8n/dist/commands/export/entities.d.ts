import { z } from 'zod';
import { BaseCommand } from '../base-command';
declare const flagsSchema: z.ZodObject<{
    outputDir: z.ZodDefault<z.ZodString>;
    includeExecutionHistoryDataTables: z.ZodDefault<z.ZodBoolean>;
    includeDataTableRows: z.ZodDefault<z.ZodBoolean>;
    keyFile: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    outputDir: string;
    includeExecutionHistoryDataTables: boolean;
    includeDataTableRows: boolean;
    keyFile?: string | undefined;
}, {
    outputDir?: string | undefined;
    includeExecutionHistoryDataTables?: boolean | undefined;
    includeDataTableRows?: boolean | undefined;
    keyFile?: string | undefined;
}>;
export declare class ExportEntitiesCommand extends BaseCommand<z.infer<typeof flagsSchema>> {
    run(): Promise<void>;
    catch(error: Error): void;
}
export {};
