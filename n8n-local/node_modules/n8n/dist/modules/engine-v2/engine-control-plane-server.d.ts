import { Logger } from '@n8n/backend-common';
import { EngineConfig } from '@n8n/config';
import { EngineCredentialsController } from './engine-credentials.controller';
import { EngineLifecycleEventController } from './engine-lifecycle-event.controller';
export declare class EngineControlPlaneServer {
    private readonly engineConfig;
    private readonly lifecycleEventController;
    private readonly credentialsController;
    private readonly logger;
    private server;
    get port(): number | undefined;
    constructor(engineConfig: EngineConfig, lifecycleEventController: EngineLifecycleEventController, credentialsController: EngineCredentialsController, logger: Logger);
    start(): Promise<void>;
    stop(): Promise<void>;
    private configureRoutes;
}
