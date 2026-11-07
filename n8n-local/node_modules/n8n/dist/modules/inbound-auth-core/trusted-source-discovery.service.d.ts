import { Logger } from '@n8n/backend-common';
import { OAuthDiscoveryClient } from '@n8n/backend-services';
import { LocalAuthorizationServer } from '@n8n/inbound-auth';
import { TrustedSourceDbStore } from './trusted-source.store';
export declare const DUE_BATCH = 200;
export declare const CONCURRENCY = 5;
export declare const RUN_DEADLINE_MS: number;
export declare class TrustedSourceDiscoveryService {
    private readonly logger;
    private readonly store;
    private readonly client;
    private readonly localServer;
    constructor(logger: Logger, store: TrustedSourceDbStore, client: OAuthDiscoveryClient, localServer: LocalAuthorizationServer);
    refresh(sourceId: string): Promise<void>;
    refreshDue(signal: AbortSignal): Promise<void>;
    private refreshSource;
    private discover;
    private collect;
}
