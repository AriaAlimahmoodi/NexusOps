import { z } from 'zod';
import { BaseCommand } from './base-command';
declare const flagsSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    rawOutput: z.ZodOptional<z.ZodBoolean>;
    file: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id?: string | undefined;
    rawOutput?: boolean | undefined;
    file?: string | undefined;
}, {
    id?: string | undefined;
    rawOutput?: boolean | undefined;
    file?: string | undefined;
}>;
export declare class Execute extends BaseCommand<z.infer<typeof flagsSchema>> {
    needsCommunityPackages: boolean;
    needsExpressionEngine: boolean;
    needsTaskRunner: boolean;
    init(): Promise<void>;
    run(): Promise<void>;
    catch(error: Error): Promise<void>;
}
export {};
