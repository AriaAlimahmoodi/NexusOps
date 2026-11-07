import { z } from 'zod';
import { BaseCommand } from '../base-command';
declare const flagsSchema: z.ZodObject<{
    active: z.ZodOptional<z.ZodString>;
    onlyId: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    active?: string | undefined;
    onlyId: boolean;
}, {
    active?: string | undefined;
    onlyId?: boolean | undefined;
}>;
export declare class ListWorkflowCommand extends BaseCommand<z.infer<typeof flagsSchema>> {
    run(): Promise<void>;
    catch(error: Error): Promise<void>;
}
export {};
