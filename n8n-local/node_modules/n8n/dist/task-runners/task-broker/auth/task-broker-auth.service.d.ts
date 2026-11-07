import { TaskRunnersConfig } from '@n8n/config';
import { CacheService } from '@n8n/backend-services';
export type GrantTokenConsumption = {
    isValid: boolean;
    boundRunnerId: string | null;
};
export declare class TaskBrokerAuthService {
    private readonly runnersConfig;
    private readonly cacheService;
    private readonly authToken;
    private get grantTokenTtlInMs();
    constructor(runnersConfig: TaskRunnersConfig, cacheService: CacheService);
    isValidAuthToken(token: string): boolean;
    createGrantToken(runnerId?: string): Promise<string>;
    tryConsumeGrantToken(grantToken: string): Promise<GrantTokenConsumption>;
    private generateGrantToken;
    private cacheKeyForGrantToken;
}
