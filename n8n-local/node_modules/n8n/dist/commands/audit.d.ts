import z from 'zod';
import { BaseCommand } from './base-command';
declare const flagsSchema: z.ZodObject<{
    categories: z.ZodDefault<z.ZodString>;
    'days-abandoned-workflow': z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    categories: string;
    'days-abandoned-workflow': number;
}, {
    categories?: string | undefined;
    'days-abandoned-workflow'?: number | undefined;
}>;
export declare class SecurityAudit extends BaseCommand<z.infer<typeof flagsSchema>> {
    init(): Promise<void>;
    run(): Promise<void>;
    catch(error: Error): Promise<void>;
}
export {};
