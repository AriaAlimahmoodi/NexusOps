import type { ModuleInterface } from '@n8n/decorators';
export declare class TokenExchangeModule implements ModuleInterface {
    entities(): Promise<never>;
    init(): Promise<void>;
    systemTasks(): Promise<(typeof import("./services/trusted-key-refresh.task.js").TrustedKeyRefreshTask | typeof import("./services/jti-cleanup.task.js").JtiCleanupTask)[]>;
}
