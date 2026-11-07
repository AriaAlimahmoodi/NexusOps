import { BaseCommand } from './base-command';
export declare class Engine extends BaseCommand {
    needsDb: boolean;
    needsTaskRunner: boolean;
    needsExpressionEngine: boolean;
    private runtime?;
    private responseSender?;
    init(): Promise<void>;
    private initBinaryDataStore;
    run(): Promise<void>;
    catch(error: Error): Promise<void>;
    protected stopProcess(): Promise<void>;
}
