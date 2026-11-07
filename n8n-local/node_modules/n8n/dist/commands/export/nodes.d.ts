import z from 'zod';
import { BaseCommand } from '../base-command';
declare const flagsSchema: z.ZodObject<{
    output: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    output: string;
}, {
    output?: string | undefined;
}>;
export declare class ExportNodes extends BaseCommand<z.infer<typeof flagsSchema>> {
    run(): Promise<void>;
    private writeNodesJSON;
}
export {};
