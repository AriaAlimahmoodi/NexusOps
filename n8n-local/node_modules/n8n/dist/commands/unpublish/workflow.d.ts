import { z } from 'zod';
import { BaseCommand } from '../base-command';
declare const flagsSchema: z.ZodObject<{
    all: z.ZodOptional<z.ZodBoolean>;
    id: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    all?: boolean | undefined;
    id?: string | undefined;
}, {
    all?: boolean | undefined;
    id?: string | undefined;
}>;
export declare class UnpublishWorkflowCommand extends BaseCommand<z.infer<typeof flagsSchema>> {
    run(): Promise<void>;
    catch(error: Error): Promise<void>;
}
export {};
