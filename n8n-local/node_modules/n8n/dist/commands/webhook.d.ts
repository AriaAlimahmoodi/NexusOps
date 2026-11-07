import { WebhookServer } from '../webhooks/webhook-server';
import { BaseCommand } from './base-command';
export declare class Webhook extends BaseCommand {
    protected server: WebhookServer;
    needsCommunityPackages: boolean;
    needsExpressionEngine: boolean;
    seedsInstanceIdentity: boolean;
    stopProcess(): Promise<void>;
    init(): Promise<void>;
    run(): Promise<void>;
    catch(error: Error): Promise<void>;
    initOrchestration(): Promise<void>;
}
