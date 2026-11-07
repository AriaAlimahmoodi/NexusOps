import { OidcConfigDto } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { OutboundHttp } from '@n8n/backend-network';
import { GlobalConfig } from '@n8n/config';
import { AuthIdentityRepository, SettingsRepository, type User, UserRepository } from '@n8n/db';
import { Cipher, InstanceSettings } from 'n8n-core';
import { ProvisioningService } from '../../modules/provisioning.ee/provisioning.service.ee';
import { JwtService, UrlService } from '@n8n/backend-services';
type OidcRuntimeConfig = Pick<OidcConfigDto, 'clientId' | 'clientSecret' | 'loginEnabled' | 'prompt' | 'authenticationContextClassReference' | 'additionalScopes' | 'emailVerifiedRequired' | 'rpInitiatedLogoutEnabled'> & {
    discoveryEndpoint: URL;
};
export declare class OidcService {
    private readonly settingsRepository;
    private readonly authIdentityRepository;
    private readonly urlService;
    private readonly globalConfig;
    private readonly userRepository;
    private readonly cipher;
    private readonly logger;
    private readonly jwtService;
    private readonly instanceSettings;
    private readonly provisioningService;
    private readonly outboundHttp;
    private oidcConfig;
    private openidClient;
    constructor(settingsRepository: SettingsRepository, authIdentityRepository: AuthIdentityRepository, urlService: UrlService, globalConfig: GlobalConfig, userRepository: UserRepository, cipher: Cipher, logger: Logger, jwtService: JwtService, instanceSettings: InstanceSettings, provisioningService: ProvisioningService, outboundHttp: OutboundHttp);
    init(): Promise<void>;
    private loadOpenIdClient;
    getCallbackUrl(): string;
    getRedactedConfig(): OidcConfigDto;
    generateState(testMode?: boolean, redirectUrl?: string): {
        signed: string;
        plaintext: string;
    };
    verifyState(signedState: string): {
        state: string;
        testMode?: boolean;
        redirectUrl?: string;
    };
    generateNonce(): {
        signed: string;
        plaintext: string;
    };
    verifyNonce(signedNonce: string): string;
    assertOidcLoginEnabled(): void;
    generateLoginUrl(redirectUrl?: string): Promise<{
        url: URL;
        state: string;
        nonce: string;
    }>;
    loginUser(callbackUrl: URL, storedState: string, storedNonce: string): Promise<{
        user: User;
        idToken?: string;
    }>;
    encryptIdToken(idToken: string): Promise<string>;
    decryptIdToken(encryptedIdToken: string): Promise<string | undefined>;
    generateEndSessionUrl(idToken: string): Promise<URL | undefined>;
    private assertEmailVerified;
    generateTestLoginUrl(): Promise<{
        url: URL;
        state: string;
        nonce: string;
    }>;
    processTestCallback(callbackUrl: URL, storedState: string, storedNonce: string): Promise<{
        claims: Record<string, unknown>;
        userInfo: Record<string, unknown>;
    }>;
    private logTokenExchangeError;
    private applySsoProvisioning;
    private assertProvisioningLoginAllowed;
    private broadcastReloadOIDCConfigurationCommand;
    private isReloading;
    reload(): Promise<void>;
    loadConfigurationFromDatabase(decryptSecret?: boolean): Promise<OidcRuntimeConfig | undefined>;
    loadConfig(decryptSecret?: boolean): Promise<OidcRuntimeConfig>;
    updateConfig(newConfig: OidcConfigDto): Promise<void>;
    private setOidcLoginEnabled;
    private cachedOidcConfiguration;
    private createProxyAwareConfiguration;
    private getOidcConfiguration;
}
export {};
