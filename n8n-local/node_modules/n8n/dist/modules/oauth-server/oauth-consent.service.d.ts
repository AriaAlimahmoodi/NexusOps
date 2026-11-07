import type { ConsentUiHints } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import type { User } from '@n8n/db';
import { OAuthClientRepository } from './database/repositories/oauth-client.repository';
import { UserConsentRepository } from './database/repositories/oauth-user-consent.repository';
import { OAuthAuthorizationCodeService } from './oauth-authorization-code.service';
import { OAuthSessionService, type OAuthSessionPayload } from './oauth-session.service';
import { OAuthGrantService } from './oauth-grant.service';
import { UrlService } from '@n8n/backend-services';
import { ProtectedResourceRegistry, type ProtectedResource } from '@n8n/backend-services/auth';
type ConsentDetailsResult = {
    ok: true;
    autoApproved: true;
    redirectUrl: string;
    uiHints?: ConsentUiHints;
} | {
    ok: true;
    autoApproved: false;
    clientName: string;
    clientId: string;
    resourceName?: string;
    redirectUri?: string;
    scopes: string[];
    previousScopes?: string[];
    scopeTools?: Record<string, string[]>;
    uiHints?: ConsentUiHints;
    isFirstParty: boolean;
} | {
    ok: false;
    reason: 'resource_unavailable';
} | {
    ok: false;
    reason: 'forbidden';
};
export declare class OAuthConsentService {
    private readonly logger;
    private readonly oauthSessionService;
    private readonly oauthClientRepository;
    private readonly userConsentRepository;
    private readonly authorizationCodeService;
    private readonly protectedResourceRegistry;
    private readonly urlService;
    private readonly grantService;
    constructor(logger: Logger, oauthSessionService: OAuthSessionService, oauthClientRepository: OAuthClientRepository, userConsentRepository: UserConsentRepository, authorizationCodeService: OAuthAuthorizationCodeService, protectedResourceRegistry: ProtectedResourceRegistry, urlService: UrlService, grantService: OAuthGrantService);
    getConsentDetails(sessionToken: string, user: User): Promise<ConsentDetailsResult | null>;
    private supportedScopesFor;
    private grantableScopes;
    private previousScopes;
    handleConsentDecision(sessionToken: string, user: User, approved: boolean, scopes?: string[]): Promise<{
        redirectUrl: string;
    }>;
    private assertAuthorized;
    private issueGrant;
    private resolveGrantedScopes;
    tryReuseConsent(user: User, sessionPayload: OAuthSessionPayload, resolvedResource?: ProtectedResource): Promise<{
        redirectUrl: string;
    } | null>;
}
export {};
