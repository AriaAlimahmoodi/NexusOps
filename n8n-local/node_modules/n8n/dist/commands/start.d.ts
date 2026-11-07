import { z } from 'zod';
import { ActiveWorkflowManager } from '../active-workflow-manager';
import { Server } from '../server';
import { BaseCommand } from './base-command';
declare const flagsSchema: z.ZodObject<{
    open: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    open?: boolean | undefined;
}, {
    open?: boolean | undefined;
}>;
export declare class Start extends BaseCommand<z.infer<typeof flagsSchema>> {
    protected activeWorkflowManager: ActiveWorkflowManager;
    protected server: Server;
    needsCommunityPackages: boolean;
    needsExpressionEngine: boolean;
    needsTaskRunner: boolean;
    seedsInstanceIdentity: boolean;
    readonly isMainServer = true;
    private getEditorUrl;
    private openBrowser;
    stopProcess(): Promise<void>;
    private generateConfigTags;
    private generateStaticAssets;
    init(): Promise<void>;
    private initInstanceSettingsLoader;
    initOrchestration(): Promise<void>;
    private ensureMultiMainLicensed;
    run(): Promise<void>;
    catch(error: Error): Promise<void>;
}
export {};
