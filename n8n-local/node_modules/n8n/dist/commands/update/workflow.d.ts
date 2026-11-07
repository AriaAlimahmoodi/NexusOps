import { z } from 'zod';
import { BaseCommand } from '../base-command';
declare const flagsSchema: z.ZodObject<{
    active: z.ZodOptional<z.ZodString>;
    all: z.ZodOptional<z.ZodBoolean>;
    id: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    active?: string | undefined;
    all?: boolean | undefined;
    id?: string | undefined;
}, {
    active?: string | undefined;
    all?: boolean | undefined;
    id?: string | undefined;
}>;
export declare class UpdateWorkflowCommand extends BaseCommand<z.infer<typeof flagsSchema>> {
    run(): Promise<void>;
    catch(error: Error): Promise<void>;
}
export {};
