import { z } from 'zod';
import { BaseCommand } from '../base-command';
declare const flagsSchema: z.ZodObject<{
    id: z.ZodString;
    versionId: z.ZodOptional<z.ZodString>;
    all: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    id: string;
    versionId?: string | undefined;
    all?: boolean | undefined;
}, {
    id: string;
    versionId?: string | undefined;
    all?: boolean | undefined;
}>;
export declare class PublishWorkflowCommand extends BaseCommand<z.infer<typeof flagsSchema>> {
    run(): Promise<void>;
    catch(error: Error): Promise<void>;
}
export {};
