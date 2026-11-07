import { SystemTask } from '@n8n/decorators';
import type { SystemTaskSchedule } from '@n8n/decorators';
import { ExternalSecretsManager } from './external-secrets-manager.ee';
import { ExternalSecretsConfig } from './external-secrets.config';
export declare class ExternalSecretsRefreshTask implements SystemTask {
    private readonly manager;
    readonly name = "external-secrets-refresh";
    readonly schedule: SystemTaskSchedule;
    readonly target: import("@n8n/decorators").InstanceTarget;
    constructor(config: ExternalSecretsConfig, manager: ExternalSecretsManager);
    run(signal: AbortSignal): Promise<void>;
}
