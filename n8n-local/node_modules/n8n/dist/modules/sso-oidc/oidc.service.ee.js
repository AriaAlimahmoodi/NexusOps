"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OidcService = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const backend_network_1 = require("@n8n/backend-network");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const crypto_1 = require("crypto");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const util_1 = require("util");
const errors_1 = require("@n8n/errors");
const claims_context_builder_1 = require("../../modules/provisioning.ee/claims-context.builder");
const provisioning_service_ee_1 = require("../../modules/provisioning.ee/provisioning.service.ee");
const backend_services_1 = require("@n8n/backend-services");
const sso_helpers_1 = require("../../sso.ee/sso-helpers");
const constants_1 = require("./constants");
const DEFAULT_OIDC_CONFIG = {
    clientId: '',
    clientSecret: '',
    discoveryEndpoint: '',
    loginEnabled: false,
    prompt: 'select_account',
    authenticationContextClassReference: [],
    additionalScopes: '',
    rpInitiatedLogoutEnabled: false,
};
const DEFAULT_OIDC_RUNTIME_CONFIG = {
    ...DEFAULT_OIDC_CONFIG,
    discoveryEndpoint: new URL('http://n8n.io/not-set'),
};
function safeStringify(value) {
    try {
        return (0, util_1.inspect)(value, { depth: 3, breakLength: 120 });
    }
    catch {
        try {
            return Object.prototype.toString.call(value);
        }
        catch {
            return '[unserializable]';
        }
    }
}
let OidcService = class OidcService {
    constructor(settingsRepository, authIdentityRepository, urlService, globalConfig, userRepository, cipher, logger, jwtService, instanceSettings, provisioningService, outboundHttp) {
        this.settingsRepository = settingsRepository;
        this.authIdentityRepository = authIdentityRepository;
        this.urlService = urlService;
        this.globalConfig = globalConfig;
        this.userRepository = userRepository;
        this.cipher = cipher;
        this.logger = logger;
        this.jwtService = jwtService;
        this.instanceSettings = instanceSettings;
        this.provisioningService = provisioningService;
        this.outboundHttp = outboundHttp;
        this.oidcConfig = DEFAULT_OIDC_RUNTIME_CONFIG;
        this.isReloading = false;
    }
    async init() {
        this.oidcConfig = await this.loadConfig(true);
        this.logger.debug(`OIDC login is ${this.oidcConfig.loginEnabled ? 'enabled' : 'disabled'}.`);
        await this.setOidcLoginEnabled(this.oidcConfig.loginEnabled);
        if (this.oidcConfig.loginEnabled) {
            await this.loadOpenIdClient();
        }
    }
    async loadOpenIdClient() {
        if (!this.openidClient) {
            this.openidClient = await import('openid-client');
        }
    }
    getCallbackUrl() {
        return `${this.urlService.getInstanceBaseUrl()}/${this.globalConfig.endpoints.rest}/sso/oidc/callback`;
    }
    getRedactedConfig() {
        return {
            ...this.oidcConfig,
            discoveryEndpoint: this.oidcConfig.discoveryEndpoint.toString(),
            clientSecret: constants_1.OIDC_CLIENT_SECRET_REDACTED_VALUE,
        };
    }
    generateState(testMode = false, redirectUrl) {
        const state = `n8n_state:${(0, crypto_1.randomUUID)()}`;
        const payload = { state };
        if (testMode) {
            payload.testMode = true;
        }
        if (redirectUrl && redirectUrl !== '/') {
            payload.redirectUrl = redirectUrl;
        }
        return {
            signed: this.jwtService.sign('oidcState', payload, { expiresIn: '15m' }),
            plaintext: state,
        };
    }
    verifyState(signedState) {
        let state;
        let testMode;
        let redirectUrl;
        try {
            const decodedState = this.jwtService.verify('oidcState', signedState);
            state = decodedState?.state;
            testMode = decodedState?.testMode;
            redirectUrl = decodedState?.redirectUrl;
        }
        catch (error) {
            this.logger.error('Failed to verify state', { error });
            throw new errors_1.BadRequestError('Invalid state');
        }
        if (typeof state !== 'string') {
            this.logger.error('Provided state has an invalid format');
            throw new errors_1.BadRequestError('Invalid state');
        }
        const splitState = state.split(':');
        if (splitState.length !== 2 || splitState[0] !== 'n8n_state') {
            this.logger.error('Provided state is missing the well-known prefix');
            throw new errors_1.BadRequestError('Invalid state');
        }
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(splitState[1])) {
            this.logger.error('Provided state is not formatted correctly');
            throw new errors_1.BadRequestError('Invalid state');
        }
        return {
            state,
            testMode,
            ...(typeof redirectUrl === 'string' && { redirectUrl }),
        };
    }
    generateNonce() {
        const nonce = `n8n_nonce:${(0, crypto_1.randomUUID)()}`;
        return {
            signed: this.jwtService.sign('oidcNonce', { nonce }, { expiresIn: '15m' }),
            plaintext: nonce,
        };
    }
    verifyNonce(signedNonce) {
        let nonce;
        try {
            const decodedNonce = this.jwtService.verify('oidcNonce', signedNonce);
            nonce = decodedNonce?.nonce;
        }
        catch (error) {
            this.logger.error('Failed to verify nonce', { error });
            throw new errors_1.BadRequestError('Invalid nonce');
        }
        if (typeof nonce !== 'string') {
            this.logger.error('Provided nonce has an invalid format');
            throw new errors_1.BadRequestError('Invalid nonce');
        }
        const splitNonce = nonce.split(':');
        if (splitNonce.length !== 2 || splitNonce[0] !== 'n8n_nonce') {
            this.logger.error('Provided nonce is missing the well-known prefix');
            throw new errors_1.BadRequestError('Invalid nonce');
        }
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(splitNonce[1])) {
            this.logger.error('Provided nonce is not formatted correctly');
            throw new errors_1.BadRequestError('Invalid nonce');
        }
        return nonce;
    }
    assertOidcLoginEnabled() {
        if (!this.oidcConfig.loginEnabled || !(0, sso_helpers_1.isOidcCurrentAuthenticationMethod)()) {
            throw new errors_1.ForbiddenError('OIDC login is not enabled');
        }
    }
    async generateLoginUrl(redirectUrl) {
        this.assertOidcLoginEnabled();
        await this.loadOpenIdClient();
        const configuration = await this.getOidcConfiguration();
        const state = this.generateState(false, redirectUrl);
        const nonce = this.generateNonce();
        const prompt = this.oidcConfig.prompt;
        const authenticationContextClassReference = this.oidcConfig.authenticationContextClassReference;
        const provisioningConfig = await this.provisioningService.getConfig();
        const provisioningEnabled = provisioningConfig.scopesProvisionInstanceRole ||
            provisioningConfig.scopesProvisionProjectRoles;
        const baseScope = provisioningEnabled
            ? `openid email profile ${provisioningConfig.scopesName}`
            : 'openid email profile';
        const additionalScopes = this.oidcConfig.additionalScopes.trim();
        const scope = additionalScopes ? `${baseScope} ${additionalScopes}` : baseScope;
        const authorizationURL = this.openidClient.buildAuthorizationUrl(configuration, {
            redirect_uri: this.getCallbackUrl(),
            response_type: 'code',
            scope,
            prompt,
            state: state.plaintext,
            nonce: nonce.plaintext,
            ...(authenticationContextClassReference.length > 0 && {
                acr_values: authenticationContextClassReference.join(' '),
            }),
        });
        return { url: authorizationURL, state: state.signed, nonce: nonce.signed };
    }
    async loginUser(callbackUrl, storedState, storedNonce) {
        this.assertOidcLoginEnabled();
        await this.loadOpenIdClient();
        const configuration = await this.getOidcConfiguration();
        const { state: expectedState } = this.verifyState(storedState);
        const expectedNonce = this.verifyNonce(storedNonce);
        let tokens;
        try {
            tokens = await this.openidClient.authorizationCodeGrant(configuration, callbackUrl, {
                expectedState,
                expectedNonce,
            });
        }
        catch (error) {
            this.logTokenExchangeError(error);
            throw new errors_1.BadRequestError('Invalid authorization code');
        }
        let claims;
        try {
            claims = tokens.claims();
        }
        catch (error) {
            this.logger.error('Failed to extract claims from tokens', { error });
            throw new errors_1.BadRequestError('Invalid token');
        }
        if (!claims) {
            throw new errors_1.ForbiddenError('No claims found in the OIDC token');
        }
        let userInfo;
        try {
            userInfo = configuration.serverMetadata().userinfo_endpoint
                ? await this.openidClient.fetchUserInfo(configuration, tokens.access_token, claims.sub)
                : claims;
        }
        catch (error) {
            this.logger.error('Failed to fetch user info', { cause: safeStringify(error) });
            throw new errors_1.BadRequestError('Invalid token');
        }
        if (!userInfo.email) {
            throw new errors_1.BadRequestError('An email is required');
        }
        if (typeof userInfo.email !== 'string' || !(0, db_1.isValidEmail)(userInfo.email)) {
            throw new errors_1.BadRequestError('Invalid email format');
        }
        const email = userInfo.email;
        await this.assertProvisioningLoginAllowed(claims, userInfo);
        const openidUser = await this.authIdentityRepository.findOne({
            where: { providerId: claims.sub, providerType: 'oidc' },
            relations: {
                user: {
                    role: true,
                },
            },
        });
        if (openidUser) {
            await this.applySsoProvisioning(openidUser.user, claims, userInfo);
            return { user: openidUser.user, idToken: tokens.id_token };
        }
        const foundUser = await this.userRepository.findOne({
            where: { email },
            relations: ['authIdentities', 'role'],
        });
        if (foundUser) {
            this.assertEmailVerified(userInfo.email_verified);
            this.logger.debug(`OIDC login: User with email ${userInfo.email} already exists, linking OIDC identity.`);
            const id = this.authIdentityRepository.create({
                providerId: claims.sub,
                providerType: 'oidc',
                userId: foundUser.id,
            });
            await this.authIdentityRepository.save(id);
            await this.applySsoProvisioning(foundUser, claims, userInfo);
            return { user: foundUser, idToken: tokens.id_token };
        }
        const user = await this.userRepository.manager.transaction(async (trx) => {
            const { user: newUser } = await this.userRepository.createUserWithProject({
                firstName: typeof userInfo.given_name === 'string' ? userInfo.given_name : undefined,
                lastName: typeof userInfo.family_name === 'string' ? userInfo.family_name : undefined,
                email,
                authIdentities: [],
                role: db_1.GLOBAL_MEMBER_ROLE,
                password: 'no password set',
            }, trx);
            await trx.save(trx.create(db_1.AuthIdentity, {
                providerId: claims.sub,
                providerType: 'oidc',
                userId: newUser.id,
            }));
            return newUser;
        });
        await this.applySsoProvisioning(user, claims, userInfo);
        return { user, idToken: tokens.id_token };
    }
    async encryptIdToken(idToken) {
        return await this.cipher.encryptV2(idToken);
    }
    async decryptIdToken(encryptedIdToken) {
        try {
            const idToken = await this.cipher.decryptV2(encryptedIdToken);
            return idToken === '' ? undefined : idToken;
        }
        catch (error) {
            this.logger.warn('Failed to decrypt the stored OIDC ID token', {
                cause: safeStringify(error),
            });
            return undefined;
        }
    }
    async generateEndSessionUrl(idToken) {
        if (!this.oidcConfig.rpInitiatedLogoutEnabled) {
            return undefined;
        }
        await this.loadOpenIdClient();
        const configuration = await this.getOidcConfiguration();
        if (!configuration.serverMetadata().end_session_endpoint) {
            this.logger.debug('The OIDC provider does not advertise an end_session_endpoint, skipping RP-initiated logout');
            return undefined;
        }
        return this.openidClient.buildEndSessionUrl(configuration, {
            id_token_hint: idToken,
            post_logout_redirect_uri: `${this.urlService.getInstanceBaseUrl()}/signin`,
        });
    }
    assertEmailVerified(emailVerified) {
        const isVerified = emailVerified === true || emailVerified === 'true';
        const isExplicitlyUnverified = emailVerified === false || emailVerified === 'false';
        if (isExplicitlyUnverified || (this.oidcConfig.emailVerifiedRequired && !isVerified)) {
            throw new errors_1.BadRequestError('Email address is not verified by the identity provider');
        }
    }
    async generateTestLoginUrl() {
        await this.loadOpenIdClient();
        const config = await this.loadConfig(true);
        const configuration = await this.createProxyAwareConfiguration(config.discoveryEndpoint, config.clientId, config.clientSecret);
        const state = this.generateState(true);
        const nonce = this.generateNonce();
        const provisioningConfig = await this.provisioningService.getConfig();
        const provisioningEnabled = provisioningConfig.scopesProvisionInstanceRole ||
            provisioningConfig.scopesProvisionProjectRoles;
        const baseScope = provisioningEnabled
            ? `openid email profile ${provisioningConfig.scopesName}`
            : 'openid email profile';
        const additionalScopes = config.additionalScopes.trim();
        const scope = additionalScopes ? `${baseScope} ${additionalScopes}` : baseScope;
        const authorizationURL = this.openidClient.buildAuthorizationUrl(configuration, {
            redirect_uri: this.getCallbackUrl(),
            response_type: 'code',
            scope,
            prompt: config.prompt,
            state: state.plaintext,
            nonce: nonce.plaintext,
            ...(config.authenticationContextClassReference.length > 0 && {
                acr_values: config.authenticationContextClassReference.join(' '),
            }),
        });
        return { url: authorizationURL, state: state.signed, nonce: nonce.signed };
    }
    async processTestCallback(callbackUrl, storedState, storedNonce) {
        await this.loadOpenIdClient();
        const config = await this.loadConfig(true);
        const configuration = await this.createProxyAwareConfiguration(config.discoveryEndpoint, config.clientId, config.clientSecret);
        const { state: expectedState } = this.verifyState(storedState);
        const expectedNonce = this.verifyNonce(storedNonce);
        let tokens;
        try {
            tokens = await this.openidClient.authorizationCodeGrant(configuration, callbackUrl, {
                expectedState,
                expectedNonce,
            });
        }
        catch (error) {
            this.logTokenExchangeError(error);
            throw new errors_1.BadRequestError('Invalid authorization code');
        }
        let claims;
        try {
            claims = tokens.claims();
        }
        catch (error) {
            this.logger.error('Failed to extract claims from tokens', { error });
            throw new errors_1.BadRequestError('Invalid token');
        }
        if (!claims) {
            throw new errors_1.ForbiddenError('No claims found in the OIDC token');
        }
        let userInfo;
        try {
            userInfo = configuration.serverMetadata().userinfo_endpoint
                ? await this.openidClient.fetchUserInfo(configuration, tokens.access_token, claims.sub)
                : claims;
        }
        catch (error) {
            this.logger.error('Failed to fetch user info', { cause: safeStringify(error) });
            throw new errors_1.BadRequestError('Invalid token');
        }
        return {
            claims: { ...claims },
            userInfo: { ...userInfo },
        };
    }
    logTokenExchangeError(error) {
        const isOAuthError = (e) => typeof e === 'object' && e !== null;
        const e = isOAuthError(error) ? error : {};
        this.logger.error('Failed to exchange authorization code for tokens', {
            oauthError: typeof e.error === 'string' ? e.error : undefined,
            oauthErrorDescription: typeof e.error_description === 'string' ? e.error_description : undefined,
            code: typeof e.code === 'string' ? e.code : undefined,
            message: error instanceof Error ? error.message : safeStringify(error),
        });
    }
    async applySsoProvisioning(user, claims, userInfo) {
        if (await this.provisioningService.isExpressionMappingEnabled()) {
            const context = (0, claims_context_builder_1.buildOidcClaimsContext)(claims, userInfo);
            await this.provisioningService.provisionExpressionMappedRolesForUser(user, context);
            return;
        }
        const provisioningConfig = await this.provisioningService.getConfig();
        const projectRoleMapping = claims[provisioningConfig.scopesProjectsRolesClaimName];
        const instanceRole = claims[provisioningConfig.scopesInstanceRoleClaimName];
        await this.provisioningService.provisionInstanceRoleForUser(user, instanceRole);
        if (projectRoleMapping) {
            await this.provisioningService.provisionProjectRolesForUser(user.id, projectRoleMapping);
        }
    }
    async assertProvisioningLoginAllowed(claims, userInfo) {
        const provisioningConfig = await this.provisioningService.getConfig();
        await this.provisioningService.assertSsoLoginAllowed((0, claims_context_builder_1.buildOidcClaimsContext)(claims, userInfo), claims[provisioningConfig.scopesInstanceRoleClaimName]);
    }
    async broadcastReloadOIDCConfigurationCommand() {
        if (this.instanceSettings.isMultiMain) {
            const { Publisher } = await import('../../scaling/pubsub/publisher.service.js');
            await di_1.Container.get(Publisher).publishCommand({ command: 'reload-oidc-config' });
        }
    }
    async reload() {
        if (this.isReloading) {
            this.logger.warn('OIDC configuration reload already in progress');
            return;
        }
        this.isReloading = true;
        try {
            this.logger.debug('OIDC configuration changed, starting to load it from the database');
            const configFromDB = await this.loadConfigurationFromDatabase(true);
            if (configFromDB) {
                this.oidcConfig = configFromDB;
                this.cachedOidcConfiguration = undefined;
            }
            else {
                this.logger.warn('OIDC configuration not found in database, ignoring reload message');
            }
            await (0, sso_helpers_1.reloadAuthenticationMethod)();
            const isOidcLoginEnabled = (0, sso_helpers_1.isOidcCurrentAuthenticationMethod)();
            this.logger.debug(`OIDC login is now ${isOidcLoginEnabled ? 'enabled' : 'disabled'}.`);
            di_1.Container.get(config_1.GlobalConfig).sso.oidc.loginEnabled = isOidcLoginEnabled;
        }
        catch (error) {
            this.logger.error('OIDC configuration changed, failed to reload OIDC configuration', {
                error,
            });
        }
        finally {
            this.isReloading = false;
        }
    }
    async loadConfigurationFromDatabase(decryptSecret = false) {
        const configFromDB = await this.settingsRepository.findByKey(constants_1.OIDC_PREFERENCES_DB_KEY);
        if (configFromDB) {
            try {
                const configValue = (0, n8n_workflow_1.jsonParse)(configFromDB.value);
                if (configValue.discoveryEndpoint === '')
                    return undefined;
                const oidcConfig = api_types_1.OidcConfigDto.parse(configValue);
                const discoveryUrl = new URL(oidcConfig.discoveryEndpoint);
                if (oidcConfig.clientSecret && decryptSecret) {
                    oidcConfig.clientSecret = await this.cipher.decryptV2(oidcConfig.clientSecret);
                }
                return {
                    ...oidcConfig,
                    discoveryEndpoint: discoveryUrl,
                };
            }
            catch (error) {
                this.logger.warn('Failed to load OIDC configuration from database, falling back to default configuration.', { error });
            }
        }
        return undefined;
    }
    async loadConfig(decryptSecret = false) {
        const currentConfig = await this.loadConfigurationFromDatabase(decryptSecret);
        if (currentConfig) {
            return currentConfig;
        }
        return DEFAULT_OIDC_RUNTIME_CONFIG;
    }
    async updateConfig(newConfig) {
        if (newConfig.loginEnabled) {
            (0, sso_helpers_1.assertAuthenticationMethodCanBeEnabled)('oidc');
        }
        let discoveryEndpoint;
        try {
            discoveryEndpoint = new URL(newConfig.discoveryEndpoint);
        }
        catch (error) {
            this.logger.error(`The provided endpoint is not a valid URL: ${newConfig.discoveryEndpoint}`);
            throw new n8n_workflow_1.UserError('Provided discovery endpoint is not a valid URL');
        }
        if (newConfig.clientSecret === constants_1.OIDC_CLIENT_SECRET_REDACTED_VALUE) {
            newConfig.clientSecret = this.oidcConfig.clientSecret;
        }
        try {
            const discoveredMetadata = await this.createProxyAwareConfiguration(discoveryEndpoint, newConfig.clientId, newConfig.clientSecret);
            this.logger.debug(`Discovered OIDC metadata: ${JSON.stringify(discoveredMetadata)}`);
        }
        catch (error) {
            this.logger.error('Failed to discover OIDC metadata', { error });
            throw new n8n_workflow_1.UserError('Failed to discover OIDC metadata, based on the provided configuration');
        }
        await this.settingsRepository.save({
            key: constants_1.OIDC_PREFERENCES_DB_KEY,
            value: JSON.stringify({
                ...newConfig,
                clientSecret: await this.cipher.encryptV2(newConfig.clientSecret),
            }),
            loadOnStartup: true,
        });
        this.oidcConfig = {
            ...newConfig,
            discoveryEndpoint,
        };
        this.cachedOidcConfiguration = undefined;
        this.logger.debug(`OIDC login is now ${this.oidcConfig.loginEnabled ? 'enabled' : 'disabled'}.`);
        await this.setOidcLoginEnabled(this.oidcConfig.loginEnabled);
        await this.broadcastReloadOIDCConfigurationCommand();
    }
    async setOidcLoginEnabled(enabled) {
        const currentAuthenticationMethod = (0, sso_helpers_1.getCurrentAuthenticationMethod)();
        if (enabled) {
            (0, sso_helpers_1.assertAuthenticationMethodCanBeEnabled)('oidc');
        }
        const targetAuthenticationMethod = !enabled && currentAuthenticationMethod === 'oidc' ? 'email' : currentAuthenticationMethod;
        di_1.Container.get(config_1.GlobalConfig).sso.oidc.loginEnabled = enabled;
        await (0, sso_helpers_1.setCurrentAuthenticationMethod)(enabled ? 'oidc' : targetAuthenticationMethod);
    }
    async createProxyAwareConfiguration(discoveryUrl, clientId, clientSecret) {
        await this.loadOpenIdClient();
        const customFetch = this.outboundHttp
            .transport({
            useDefaultSsrfPolicy: 'unsafe',
        })
            .asCustomFetch();
        const configuration = await this.openidClient.discovery(discoveryUrl, clientId, clientSecret, undefined, {
            [this.openidClient.customFetch]: customFetch,
        });
        configuration[this.openidClient.customFetch] = customFetch;
        return configuration;
    }
    async getOidcConfiguration() {
        const now = Date.now();
        if (this.cachedOidcConfiguration === undefined ||
            now >= this.cachedOidcConfiguration.validTill.getTime() ||
            this.oidcConfig.discoveryEndpoint.toString() !==
                this.cachedOidcConfiguration.discoveryEndpoint.toString() ||
            this.oidcConfig.clientId !== this.cachedOidcConfiguration.clientId ||
            this.oidcConfig.clientSecret !== this.cachedOidcConfiguration.clientSecret) {
            this.cachedOidcConfiguration = {
                ...this.oidcConfig,
                configuration: this.createProxyAwareConfiguration(this.oidcConfig.discoveryEndpoint, this.oidcConfig.clientId, this.oidcConfig.clientSecret),
                validTill: new Date(Date.now() + 60 * 60 * 1000),
            };
        }
        return await this.cachedOidcConfiguration.configuration;
    }
};
exports.OidcService = OidcService;
__decorate([
    (0, decorators_1.OnPubSubEvent)('reload-oidc-config'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OidcService.prototype, "reload", null);
exports.OidcService = OidcService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.SettingsRepository, db_1.AuthIdentityRepository, backend_services_1.UrlService, config_1.GlobalConfig, db_1.UserRepository, n8n_core_1.Cipher, backend_common_1.Logger, backend_services_1.JwtService, n8n_core_1.InstanceSettings, provisioning_service_ee_1.ProvisioningService, backend_network_1.OutboundHttp])
], OidcService);
//# sourceMappingURL=oidc.service.ee.js.map