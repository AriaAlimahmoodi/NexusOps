import { z } from 'zod';
import { BaseCommand } from '../base-command';
declare const flagsSchema: z.ZodObject<{
    inputDir: z.ZodDefault<z.ZodString>;
    truncateTables: z.ZodDefault<z.ZodBoolean>;
    keyFile: z.ZodOptional<z.ZodString>;
    skipMigrationChecks: z.ZodDefault<z.ZodBoolean>;
    skipTogglingForeignKeyConstraints: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    inputDir: string;
    truncateTables: boolean;
    keyFile?: string | undefined;
    skipMigrationChecks: boolean;
    skipTogglingForeignKeyConstraints: boolean;
}, {
    inputDir?: string | undefined;
    truncateTables?: boolean | undefined;
    keyFile?: string | undefined;
    skipMigrationChecks?: boolean | undefined;
    skipTogglingForeignKeyConstraints?: boolean | undefined;
}>;
export declare class ImportEntitiesCommand extends BaseCommand<z.infer<typeof flagsSchema>> {
    run(): Promise<void>;
    catch(error: Error): void;
}
export {};
