import { BaseCommand } from '../base-command';
export declare class ClearLicenseCommand extends BaseCommand {
    run(): Promise<void>;
    catch(error: Error): Promise<void>;
}
