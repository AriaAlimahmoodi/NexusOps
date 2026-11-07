import { AbstractServer } from '../abstract-server';
export declare class WebhookServer extends AbstractServer {
    configure(): Promise<void>;
    protected setupPushServer(): void;
}
