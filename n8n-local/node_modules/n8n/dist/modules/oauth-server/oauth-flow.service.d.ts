import { Logger } from '@n8n/backend-common';
import { OutboundHttp } from '@n8n/backend-network';
import { CacheService } from '@n8n/backend-services';
import { type N8nOAuth2Flow, type OAuth2FlowRequest, ProtectedResourceRegistry } from '@n8n/backend-services/auth';
import { ResourceAdmission, TrustedSourceStore } from '@n8n/inbound-auth';
import { type N8nOAuth2FlowResult, type N8nOAuth2RefreshResult } from 'n8n-workflow';
import { OAuthServerService } from './oauth-server.service';
export declare function encodeRefreshGrant(sourceId: string, refreshToken: string): string;
export declare function decodeRefreshGrant(grant: string): {
    sourceId: string;
    refreshToken: string;
} | undefined;
export declare class OAuth2FlowService implements N8nOAuth2Flow {
    private readonly oauthServerService;
    private readonly resourceRegistry;
    private readonly cacheService;
    private readonly store;
    private readonly admission;
    private readonly http;
    private readonly logger;
    constructor(oauthServerService: OAuthServerService, resourceRegistry: ProtectedResourceRegistry, cacheService: CacheService, store: TrustedSourceStore, admission: ResourceAdmission, outboundHttp: OutboundHttp, logger: Logger);
    begin(resourceUrl: string, metadata?: Record<string, string>): Promise<string>;
    complete(code: string, state: string, request?: OAuth2FlowRequest): Promise<N8nOAuth2FlowResult>;
    refresh(grant: string, resourceUrl: string): Promise<N8nOAuth2RefreshResult>;
    private refreshWithVirtualClient;
    private refreshWithRegisteredClient;
    private redirectLoginOf;
    private exchangeWithVirtualClient;
    private exchangeWithRegisteredClient;
    private requestTokens;
}
