import type { Application } from 'express';
import { type Server as HttpServer } from 'http';
import { InstanceAiBrowserSessionService } from './instance-ai-browser-session.service';
export declare class BrowserUseServer {
    private readonly sessionService;
    private readonly wsServer;
    constructor(sessionService: InstanceAiBrowserSessionService);
    setup(server: HttpServer, app: Application): void;
    private onUpgrade;
    shutdown(): void;
}
