import { Logger } from '@n8n/backend-common';
import { SystemTask } from '@n8n/decorators';
import type { SystemTaskSchedule } from '@n8n/decorators';
import { TokenExchangeJtiRepository } from '../database/repositories/token-exchange-jti.repository';
import { TokenExchangeConfig } from '../token-exchange.config';
export declare class JtiCleanupTask implements SystemTask {
    private readonly config;
    private readonly jtiRepository;
    readonly name = "jti-cleanup";
    readonly schedule: SystemTaskSchedule;
    readonly target: import("@n8n/decorators").ClusterTarget;
    private readonly logger;
    constructor(logger: Logger, config: TokenExchangeConfig, jtiRepository: TokenExchangeJtiRepository);
    run(signal: AbortSignal): Promise<void>;
}
