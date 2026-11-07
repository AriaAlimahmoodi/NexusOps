import { LockService, Logger } from '@n8n/backend-common';
import { OutboundHttp, SsrfProtectionService, type SsrfBridge } from '@n8n/backend-network';
import { CacheService, EventService, UrlService, CredentialsFinderService } from '@n8n/backend-services';
import { OAuthJweServiceProxy } from '@n8n/backend-services/auth';
import { GlobalConfig, SsrfProtectionConfig } from '@n8n/config';
import type { AuthenticatedRequest, CredentialsEntity, ICredentialsDb } from '@n8n/db';
import { CredentialsRepository } from '@n8n/db';
import type { Request, Response } from 'express';
import { Cipher } from 'n8n-core';
import type { ICredentialDataDecryptedObject, IWorkflowExecuteAdditionalData } from 'n8n-workflow';
import { AuthService } from '../auth/auth.service';
import { CredentialsHelper } from '../credentials-helper';
import { BadRequestError } from '@n8n/errors';
import type { OAuthRequest } from '../requests';
import { ExternalHooks } from '../external-hooks';
import { OauthVersion, type CreateCsrfStateData, type CsrfState, type OAuth1CredentialData } from './types';
import { DynamicCredentialsProxy } from '../credentials/dynamic-credentials-proxy';
import { OAuthBrowserBindingService } from '../oauth/oauth-browser-binding.service';
export type OauthFlowState = {
    csrfSecret: string;
    stateData?: CreateCsrfStateData;
    codeVerifier?: string;
    oauthTokenSecret?: string;
};
export interface OAuth2CredentialRefreshResult {
    headers: Record<string, string>;
    expiresAt?: number;
    expiresInSeconds?: number;
}
export interface OAuth2CredentialTokenRevision {
    accessToken?: string;
    expiresAt?: number;
}
export declare function shouldSkipAuthOnOAuthCallback(): boolean;
export declare const skipAuthOnOAuthCallback: boolean;
export { OauthVersion, type OAuth1CredentialData, type CreateCsrfStateData, type CsrfState };
export declare class InvalidTargetError extends BadRequestError {
    constructor(message: string);
}
export declare class InvalidOAuthUrlError extends BadRequestError {
    constructor(message: string);
}
export declare class OauthService {
    protected readonly logger: Logger;
    private readonly lockService;
    private readonly credentialsHelper;
    private readonly credentialsRepository;
    private readonly credentialsFinderService;
    private readonly urlService;
    private readonly globalConfig;
    private readonly externalHooks;
    private readonly cipher;
    private readonly dynamicCredentialsProxy;
    private readonly authService;
    private readonly oauthJweServiceProxy;
    private readonly browserBindingService;
    private readonly eventService;
    private readonly cacheService;
    private readonly ssrfProtectionService;
    private readonly ssrfProtectionConfig;
    private readonly oauth2Refreshes;
    constructor(logger: Logger, lockService: LockService, credentialsHelper: CredentialsHelper, credentialsRepository: CredentialsRepository, credentialsFinderService: CredentialsFinderService, urlService: UrlService, globalConfig: GlobalConfig, externalHooks: ExternalHooks, cipher: Cipher, dynamicCredentialsProxy: DynamicCredentialsProxy, authService: AuthService, oauthJweServiceProxy: OAuthJweServiceProxy, browserBindingService: OAuthBrowserBindingService, eventService: EventService, cacheService: CacheService, outboundHttp: OutboundHttp, ssrfProtectionService: SsrfProtectionService, ssrfProtectionConfig: SsrfProtectionConfig);
    private readonly http;
    getSsrfBridge(): SsrfBridge | undefined;
    private oauthFlowCacheKey;
    private validateOAuthUrlOrThrow;
    private validateAuthServerUrlOrThrow;
    private normalizeResourceUrl;
    private parseUrlOriginOrThrow;
    private validateResourceUrlOrThrow;
    private resolveResourceUrl;
    getBaseUrl(oauthVersion: OauthVersion): string;
    getCredentialForAuthFlow(req: OAuthRequest.OAuth1Credential.Auth | OAuthRequest.OAuth2Credential.Auth): Promise<CredentialsEntity>;
    buildCsrfStateData(credential: CredentialsEntity, req: OAuthRequest.OAuth1Credential.Auth | OAuthRequest.OAuth2Credential.Auth): Promise<CreateCsrfStateData>;
    protected getAdditionalData(userId?: string): Promise<IWorkflowExecuteAdditionalData>;
    protected getDecryptedDataForAuthUri(credential: ICredentialsDb, additionalData: IWorkflowExecuteAdditionalData): Promise<ICredentialDataDecryptedObject>;
    protected getDecryptedDataForCallback(credential: ICredentialsDb, additionalData: IWorkflowExecuteAdditionalData): Promise<ICredentialDataDecryptedObject>;
    private getDecryptedData;
    protected applyDefaultsAndOverwrites<T>(credential: ICredentialsDb, decryptedData: ICredentialDataDecryptedObject, additionalData: IWorkflowExecuteAdditionalData): Promise<T>;
    encryptAndSaveData(credential: ICredentialsDb, toUpdate: ICredentialDataDecryptedObject, toDelete?: string[]): Promise<void>;
    protected getCredentialWithoutUser(credentialId: string, options?: {
        onlyProjectCredentials?: boolean;
    }): Promise<CredentialsEntity | null>;
    createCsrfState(): Promise<[string, string, string]>;
    storeOauthFlowState(stateToken: string, flowState: OauthFlowState): Promise<void>;
    protected peekOauthFlowState(stateToken: string): Promise<OauthFlowState | undefined>;
    consumeOauthFlowState(stateToken: string): Promise<OauthFlowState | undefined>;
    protected decodeCsrfState(encodedState: string, req: AuthenticatedRequest): Promise<[CsrfState & CreateCsrfStateData, CredentialsEntity | null]>;
    protected verifyCsrfState(flowState: OauthFlowState | undefined, state: CsrfState): boolean;
    resolveCredential<T>(req: OAuthRequest.OAuth1Credential.Callback | OAuthRequest.OAuth2Credential.Callback): Promise<[
        CredentialsEntity,
        ICredentialDataDecryptedObject,
        T,
        CsrfState & CreateCsrfStateData,
        OauthFlowState
    ]>;
    renderCallbackError(res: Response, message: string, reason?: string): void;
    extractCallbackErrorMessage(error: Error, credentialType?: string): string;
    extractCallbackErrorReason(error: Error): string | undefined;
    getOAuthCredentials<T>(credential: CredentialsEntity, userId?: string): Promise<T>;
    private credentialIsAccessibleToProject;
    private resolveOAuth2Resource;
    private createOAuth2ClientForRefresh;
    private mergeRefreshedOAuthTokenData;
    private getOAuth2AccessToken;
    private getOAuth2TokenRevision;
    private oauth2TokenRevisionChanged;
    private buildOAuth2RefreshResult;
    private isRevokedOAuth2GrantError;
    refreshOAuth2CredentialById(credentialId: string, projectId: string, knownTokenRevision?: OAuth2CredentialTokenRevision): Promise<OAuth2CredentialRefreshResult | null>;
    private hasFixedTokenEndpoint;
    private hasEditableScopeProperty;
    private discoverAndResolveResource;
    private applyBrowserBindingIfEnabled;
    generateAOauth2AuthUri(credential: CredentialsEntity, csrfData: CreateCsrfStateData, req?: Request, res?: Response): Promise<string>;
    private performDynamicClientRegistration;
    private applyDcrManagedFields;
    generateAOauth1AuthUri(credential: CredentialsEntity, csrfData: CreateCsrfStateData, req?: Request, res?: Response): Promise<string>;
    getOAuth1AccessToken(oauthCredentials: OAuth1CredentialData, params: {
        oauthToken: string;
        oauthVerifier: string;
        oauthTokenSecret: string;
    }): Promise<Record<string, string>>;
    private convertCredentialToOptions;
    private shouldUsePkce;
    private fetchDiscoveryDocument;
    private discoverProtectedResourceMetadata;
    private selectGrantTypeAndAuthenticationMethod;
    private selectClientSecretAuthenticationMethod;
    private mapGrantTypeAndAuthenticationMethod;
    saveDynamicCredential(credential: CredentialsEntity, oauthTokenData: ICredentialDataDecryptedObject, authHeader: string, credentialResolverId: string, authMetadata?: Record<string, unknown>): Promise<void>;
}
