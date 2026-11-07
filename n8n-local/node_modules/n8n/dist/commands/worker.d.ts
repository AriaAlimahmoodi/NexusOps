import { z } from 'zod';
import { BaseCommand } from './base-command';
declare const flagsSchema: z.ZodObject<{
    concurrency: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    concurrency: number;
}, {
    concurrency?: number | undefined;
}>;
export declare class Worker extends BaseCommand<z.infer<typeof flagsSchema>> {
    private concurrency;
    private scalingService;
    needsCommunityPackages: boolean;
    needsExpressionEngine: boolean;
    needsTaskRunner: boolean;
    seedsInstanceIdentity: boolean;
    stopProcess(): Promise<void>;
    constructor();
    init(): Promise<void>;
    initEventBus(): Promise<void>;
    initOrchestration(): Promise<void>;
    setConcurrency(): Promise<void>;
    initScalingService(): Promise<void>;
    run(): Promise<void>;
    catch(error: Error): Promise<void>;
}
export {};
