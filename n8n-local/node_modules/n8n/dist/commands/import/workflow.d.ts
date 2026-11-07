import { z } from 'zod';
import { BaseCommand } from '../base-command';
declare const flagsSchema: z.ZodObject<{
    input: z.ZodOptional<z.ZodString>;
    separate: z.ZodDefault<z.ZodBoolean>;
    userId: z.ZodOptional<z.ZodString>;
    projectId: z.ZodOptional<z.ZodString>;
    activeState: z.ZodDefault<z.ZodEnum<["false", "fromJson"]>>;
}, "strip", z.ZodTypeAny, {
    input?: string | undefined;
    separate: boolean;
    userId?: string | undefined;
    projectId?: string | undefined;
    activeState: "false" | "fromJson";
}, {
    input?: string | undefined;
    separate?: boolean | undefined;
    userId?: string | undefined;
    projectId?: string | undefined;
    activeState?: "false" | "fromJson" | undefined;
}>;
export declare class ImportWorkflowsCommand extends BaseCommand<z.infer<typeof flagsSchema>> {
    needsExpressionEngine: boolean;
    init(): Promise<void>;
    run(): Promise<void>;
    private checkRelations;
    catch(error: Error): Promise<void>;
    private reportSuccess;
    private logSkippedWorkflows;
    private getWorkflowOwner;
    private workflowExists;
    private readWorkflows;
    private getProject;
}
export {};
