import { z } from 'zod';
import { BaseCommand } from '../base-command';
declare const flagsSchema: z.ZodObject<{
    userId: z.ZodOptional<z.ZodString>;
    projectId: z.ZodOptional<z.ZodString>;
    deleteWorkflowsAndCredentials: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    userId?: string | undefined;
    projectId?: string | undefined;
    deleteWorkflowsAndCredentials?: boolean | undefined;
}, {
    userId?: string | undefined;
    projectId?: string | undefined;
    deleteWorkflowsAndCredentials?: boolean | undefined;
}>;
export declare class Reset extends BaseCommand<z.infer<typeof flagsSchema>> {
    needsExpressionEngine: boolean;
    run(): Promise<void>;
    getProject(userId?: string, projectId?: string): Promise<import("@n8n/db").Project>;
    catch(error: Error): Promise<void>;
    private getOwner;
}
export {};
