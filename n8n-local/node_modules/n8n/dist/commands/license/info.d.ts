import { BaseCommand } from '../base-command';
export declare class LicenseInfoCommand extends BaseCommand {
    run(): Promise<void>;
    catch(error: Error): Promise<void>;
}
