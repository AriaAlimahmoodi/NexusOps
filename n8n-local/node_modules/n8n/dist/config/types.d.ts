import type { RedisOptions } from 'ioredis';
import type { IProcessedDataConfig } from 'n8n-workflow';
type LegacyConfigPaths = {
    'userManagement.isInstanceOwnerSetUp': boolean;
    'userManagement.authenticationMethod': 'email' | 'ldap' | 'saml';
    'endpoints.rest': string;
    'ai.enabled': boolean;
    'ai.allowSendingParameterValues': boolean;
    'queue.bull.redis': RedisOptions;
    processedDataManager: IProcessedDataConfig;
    'ui.banners.dismissed': string[] | undefined;
    easyAIWorkflowOnboarded: boolean | undefined;
};
declare module 'convict' {
    interface Config<T> {
        getEnv<Path extends keyof LegacyConfigPaths>(path: Path): LegacyConfigPaths[Path];
    }
}
export {};
