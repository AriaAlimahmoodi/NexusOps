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
exports.SamlService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_network_1 = require("@n8n/backend-network");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const crypto_1 = require("crypto");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const errors_1 = require("@n8n/errors");
const claims_context_builder_1 = require("../../modules/provisioning.ee/claims-context.builder");
const provisioning_service_ee_1 = require("../../modules/provisioning.ee/provisioning.service.ee");
const backend_services_1 = require("@n8n/backend-services");
const sso_helpers_1 = require("../../sso.ee/sso-helpers");
const constants_1 = require("./constants");
const invalid_saml_metadata_url_error_1 = require("./errors/invalid-saml-metadata-url.error");
const invalid_saml_metadata_error_1 = require("./errors/invalid-saml-metadata.error");
const saml_email_not_verified_error_1 = require("./errors/saml-email-not-verified.error");
const saml_helpers_1 = require("./saml-helpers");
const saml_validator_1 = require("./saml-validator");
const service_provider_ee_1 = require("./service-provider.ee");
const TEST_CONFIG_TTL_MS = 10 * 60 * 1000;
const TEST_CONFIG_CACHE_PREFIX = 'saml:pending-test-config:';
let SamlService = class SamlService {
    get samlPreferences() {
        return {
            ...this._samlPreferences,
            loginEnabled: (0, sso_helpers_1.isSamlLoginEnabled)(),
            loginLabel: (0, sso_helpers_1.getSamlLoginLabel)(),
        };
    }
    constructor(logger, urlService, validator, userRepository, settingsRepository, instanceSettings, provisioningService, cipher, cacheService, outboundHttp, authIdentityRepository) {
        this.logger = logger;
        this.urlService = urlService;
        this.validator = validator;
        this.userRepository = userRepository;
        this.settingsRepository = settingsRepository;
        this.instanceSettings = instanceSettings;
        this.provisioningService = provisioningService;
        this.cipher = cipher;
        this.cacheService = cacheService;
        this.outboundHttp = outboundHttp;
        this.authIdentityRepository = authIdentityRepository;
        this._samlPreferences = {
            mapping: {
                email: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
                firstName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/firstname',
                lastName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/lastname',
                userPrincipalName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn',
            },
            metadata: '',
            metadataUrl: '',
            ignoreSSL: false,
            loginBinding: 'redirect',
            acsBinding: 'post',
            authnRequestsSigned: false,
            signingPrivateKey: undefined,
            signingCertificate: undefined,
            loginEnabled: false,
            loginLabel: 'SAML',
            wantAssertionsSigned: true,
            wantMessageSigned: true,
            relayState: this.urlService.getInstanceBaseUrl(),
            signatureConfig: {
                prefix: 'ds',
                location: {
                    reference: '/samlp:Response/saml:Issuer',
                    action: 'after',
                },
            },
        };
        this.isReloading = false;
    }
    isSignedSamlRequestsEnabled() {
        return process.env.N8N_ENV_FEAT_SIGNED_SAML_REQUESTS === 'true';
    }
    async getDecryptedSigningPrivateKey() {
        if (!this.isSignedSamlRequestsEnabled())
            return undefined;
        if (!this._samlPreferences.signingPrivateKey)
            return undefined;
        try {
            return await this.cipher.decryptV2(this._samlPreferences.signingPrivateKey);
        }
        catch {
            throw new errors_1.BadRequestError('Failed to decrypt SAML signing private key. The key may be corrupted.');
        }
    }
    isValidPemPrivateKey(pem) {
        return /^-----BEGIN (?:RSA |EC )?PRIVATE KEY-----[\s\S]+-----END (?:RSA |EC )?PRIVATE KEY-----/.test(pem.trim());
    }
    isValidPemCertificate(pem) {
        return /^-----BEGIN CERTIFICATE-----[\s\S]+-----END CERTIFICATE-----/.test(pem.trim());
    }
    validateKeyPairMatch(privateKeyPem, certificatePem) {
        try {
            const pubKeyFromPrivate = (0, crypto_1.createPublicKey)(privateKeyPem);
            const cert = new crypto_1.X509Certificate(certificatePem);
            const pubKeyFromCert = cert.publicKey;
            return pubKeyFromPrivate
                .export({ type: 'spki', format: 'der' })
                .equals(pubKeyFromCert.export({ type: 'spki', format: 'der' }));
        }
        catch {
            return false;
        }
    }
    async validateSigningKeyConfiguration(prefs) {
        const isClearingKey = prefs.signingPrivateKey === '';
        const isClearingCert = prefs.signingCertificate === '';
        const isNewKey = !!prefs.signingPrivateKey && prefs.signingPrivateKey !== n8n_workflow_1.CREDENTIAL_BLANKING_VALUE;
        const isNewCert = !!prefs.signingCertificate;
        const hasNewSigningFields = isNewKey || isNewCert;
        if (hasNewSigningFields && !this.isSignedSamlRequestsEnabled()) {
            throw new errors_1.BadRequestError('SAML request signing is not enabled. Set N8N_ENV_FEAT_SIGNED_SAML_REQUESTS=true to enable this feature.');
        }
        if (!this.isSignedSamlRequestsEnabled())
            return;
        if (isNewKey && !this.isValidPemPrivateKey(prefs.signingPrivateKey)) {
            throw new errors_1.BadRequestError('Invalid signing private key format. Must be a PEM-encoded private key.');
        }
        if (isNewCert && !this.isValidPemCertificate(prefs.signingCertificate)) {
            throw new errors_1.BadRequestError('Invalid signing certificate format. Must be a PEM-encoded certificate.');
        }
        const willHaveAuthnRequestsSigned = prefs.authnRequestsSigned ?? this._samlPreferences.authnRequestsSigned;
        if (willHaveAuthnRequestsSigned) {
            const effectiveKey = isClearingKey
                ? undefined
                : isNewKey
                    ? prefs.signingPrivateKey
                    : await this.getDecryptedSigningPrivateKey();
            const effectiveCert = isClearingCert
                ? undefined
                : isNewCert
                    ? prefs.signingCertificate
                    : this._samlPreferences.signingCertificate;
            if (!effectiveKey || !effectiveCert) {
                throw new errors_1.BadRequestError('Both signingPrivateKey and signingCertificate are required when authnRequestsSigned is enabled.');
            }
            if (!this.validateKeyPairMatch(effectiveKey, effectiveCert)) {
                throw new errors_1.BadRequestError('The signing private key and certificate do not match. Please provide a matching key/certificate pair.');
            }
        }
    }
    async init() {
        try {
            await this.loadFromDbAndApplySamlPreferences(false);
            if ((0, sso_helpers_1.isSamlLicensedAndEnabled)()) {
                await this.validator.init();
                await this.loadSamlify();
                await this.loadFromDbAndApplySamlPreferences(true);
            }
        }
        catch (error) {
            if (error instanceof invalid_saml_metadata_url_error_1.InvalidSamlMetadataUrlError ||
                error instanceof invalid_saml_metadata_error_1.InvalidSamlMetadataError ||
                error instanceof SyntaxError) {
                this.logger.warn(`SAML initialization failed because of invalid metadata in database: ${error.message}. IMPORTANT: Disabling SAML and switching to email-based login for all users. Please review your configuration and re-enable SAML.`);
                await this.reset();
            }
            else {
                throw error;
            }
        }
    }
    async loadSamlify() {
        if (this.samlify === undefined) {
            this.logger.debug('Loading samlify library into memory');
            await this.validator.init();
            this.samlify = await import('samlify');
        }
        this.samlify.setSchemaValidator({
            validate: async (response) => {
                const valid = await this.validator.validateResponse(response);
                if (!valid) {
                    throw new invalid_saml_metadata_error_1.InvalidSamlMetadataError();
                }
            },
        });
    }
    getIdentityProviderInstance(forceRecreate = false) {
        if (this.samlify === undefined) {
            throw new n8n_workflow_1.UnexpectedError('Samlify is not initialized');
        }
        if (!this._samlPreferences.metadata) {
            throw new invalid_saml_metadata_error_1.InvalidSamlMetadataError('No IdP metadata configured. Please provide valid identity provider metadata.');
        }
        if (this.identityProviderInstance === undefined || forceRecreate) {
            this.identityProviderInstance = this.samlify.IdentityProvider({
                metadata: this._samlPreferences.metadata,
            });
        }
        this.validator.validateIdentityProvider(this.identityProviderInstance);
        return this.identityProviderInstance;
    }
    getServiceProviderInstance() {
        if (this.samlify === undefined) {
            throw new n8n_workflow_1.UnexpectedError('Samlify is not initialized');
        }
        return (0, service_provider_ee_1.getServiceProviderInstance)(this._samlPreferences, this.samlify);
    }
    async getLoginRequestUrl(relayState, binding, metadata) {
        await this.loadSamlify();
        if (this.samlify === undefined) {
            throw new n8n_workflow_1.UnexpectedError('Samlify is not initialized');
        }
        const idp = metadata
            ? await this.createIdentityProviderFromMetadata(metadata)
            : this.getIdentityProviderInstance();
        binding ??= this._samlPreferences.loginBinding ?? 'redirect';
        const sp = this.getServiceProviderInstance();
        const loginRequest = sp.createLoginRequest(idp, binding, {
            relayState: relayState ?? this.urlService.getInstanceBaseUrl(),
        });
        return {
            binding,
            context: binding === 'post' ? loginRequest : loginRequest,
        };
    }
    async storePendingTestConfig(metadata) {
        const testId = (0, crypto_1.randomBytes)(6).toString('hex');
        await this.cacheService.set(`${TEST_CONFIG_CACHE_PREFIX}${testId}`, metadata, TEST_CONFIG_TTL_MS);
        return testId;
    }
    async consumePendingTestConfig(testId) {
        const key = `${TEST_CONFIG_CACHE_PREFIX}${testId}`;
        const metadata = await this.cacheService.get(key);
        if (metadata === undefined)
            return undefined;
        await this.cacheService.delete(key);
        return metadata;
    }
    async createIdentityProviderFromMetadata(metadata) {
        await this.loadSamlify();
        if (this.samlify === undefined) {
            throw new n8n_workflow_1.UnexpectedError('Samlify is not initialized');
        }
        const validationResult = await this.validator.validateMetadata(metadata);
        if (!validationResult) {
            throw new invalid_saml_metadata_error_1.InvalidSamlMetadataError();
        }
        const idp = this.samlify.IdentityProvider({ metadata });
        this.validator.validateIdentityProvider(idp);
        return idp;
    }
    async handleSamlLogin(req, binding, metadataOverride) {
        const { mapped: attributes, raw: rawAttributes } = await this.getAttributesFromLoginResponse(req, binding, metadataOverride);
        await this.provisioningService.assertSsoLoginAllowed((0, claims_context_builder_1.buildSamlClaimsContext)(rawAttributes), attributes.n8nInstanceRole);
        if (attributes.email) {
            const lowerCasedEmail = attributes.email.toLowerCase();
            if (!(0, db_1.isValidEmail)(lowerCasedEmail)) {
                throw new errors_1.BadRequestError('Invalid email format');
            }
            const identity = await this.authIdentityRepository.findByProviderIdWithUser(attributes.userPrincipalName, 'saml');
            if (identity?.user) {
                await this.applySsoProvisioning(identity.user, attributes, rawAttributes);
                return {
                    authenticatedUser: identity.user,
                    attributes,
                    rawAttributes,
                    onboardingRequired: false,
                };
            }
            const user = await this.userRepository.findOne({
                where: { email: lowerCasedEmail },
                relations: ['authIdentities', 'role'],
            });
            if (user) {
                this.assertEmailVerified(attributes.emailVerified, lowerCasedEmail);
                this.logger.info('SAML login: linking the asserted principal to an existing user by email', {
                    userId: user.id,
                    providerId: attributes.userPrincipalName,
                });
                const updatedUser = await (0, saml_helpers_1.updateUserFromSamlAttributes)(user, attributes);
                const onboardingRequired = !updatedUser.firstName || !updatedUser.lastName;
                await this.applySsoProvisioning(updatedUser, attributes, rawAttributes);
                return {
                    authenticatedUser: updatedUser,
                    attributes,
                    rawAttributes,
                    onboardingRequired,
                };
            }
            if ((0, sso_helpers_1.isSsoJustInTimeProvisioningEnabled)()) {
                const newUser = await (0, saml_helpers_1.createUserFromSamlAttributes)(attributes);
                await this.applySsoProvisioning(newUser, attributes, rawAttributes);
                return {
                    authenticatedUser: newUser,
                    attributes,
                    rawAttributes,
                    onboardingRequired: !newUser.firstName || !newUser.lastName,
                };
            }
        }
        return {
            authenticatedUser: undefined,
            attributes,
            rawAttributes,
            onboardingRequired: false,
        };
    }
    assertEmailVerified(emailVerified, email) {
        const value = typeof emailVerified === 'string' ? emailVerified.trim().toLowerCase() : undefined;
        const isVerified = value === 'true';
        const isExplicitlyUnverified = value === 'false';
        if (isExplicitlyUnverified || (this._samlPreferences.emailVerifiedRequired && !isVerified)) {
            throw new saml_email_not_verified_error_1.SamlEmailNotVerifiedError(email);
        }
    }
    async applySsoProvisioning(user, attributes, rawAttributes) {
        if (await this.provisioningService.isExpressionMappingEnabled()) {
            const context = (0, claims_context_builder_1.buildSamlClaimsContext)(rawAttributes);
            await this.provisioningService.provisionExpressionMappedRolesForUser(user, context);
            return;
        }
        await this.provisioningService.provisionInstanceRoleForUser(user, attributes?.n8nInstanceRole);
        if (attributes?.n8nProjectRoles) {
            await this.provisioningService.provisionProjectRolesForUser(user.id, attributes.n8nProjectRoles);
        }
    }
    async broadcastReloadSAMLConfigurationCommand() {
        if (this.instanceSettings.isMultiMain) {
            const { Publisher } = await import('../../scaling/pubsub/publisher.service.js');
            await di_1.Container.get(Publisher).publishCommand({ command: 'reload-saml-config' });
        }
    }
    async reload() {
        if (this.isReloading) {
            this.logger.warn('SAML configuration reload already in progress');
            return;
        }
        this.isReloading = true;
        try {
            this.logger.debug('SAML configuration changed, starting to load it from the database');
            await this.loadFromDbAndApplySamlPreferences(true, false);
            await (0, sso_helpers_1.reloadAuthenticationMethod)();
            const samlLoginEnabled = (0, sso_helpers_1.isSamlLoginEnabled)();
            this.logger.debug(`SAML login is now ${samlLoginEnabled ? 'enabled' : 'disabled'}.`);
            di_1.Container.get(config_1.GlobalConfig).sso.saml.loginEnabled = samlLoginEnabled;
        }
        catch (error) {
            this.logger.error('SAML configuration changed, failed to reload SAML configuration', {
                error,
            });
        }
        finally {
            this.isReloading = false;
        }
    }
    async setSamlPreferences(prefs, tryFallback = false, broadcastReload = true) {
        await this.loadSamlify();
        await this.validateSigningKeyConfiguration(prefs);
        const previousMetadataUrl = this._samlPreferences.metadataUrl;
        await this.loadPreferencesWithoutValidation(prefs);
        await this.applyLoadedPreferences(prefs, previousMetadataUrl, tryFallback);
        const result = await this.saveSamlPreferencesToDb();
        if (broadcastReload) {
            await this.broadcastReloadSAMLConfigurationCommand();
        }
        return result;
    }
    async applyLoadedPreferences(prefs, previousMetadataUrl, tryFallback = true) {
        if (prefs.metadataUrl) {
            try {
                const fetchedMetadata = await this.fetchMetadataFromUrl();
                if (fetchedMetadata) {
                    this._samlPreferences.metadata = fetchedMetadata;
                }
                else {
                    throw new invalid_saml_metadata_url_error_1.InvalidSamlMetadataUrlError(prefs.metadataUrl);
                }
            }
            catch (error) {
                this._samlPreferences.metadataUrl = previousMetadataUrl;
                if (!tryFallback) {
                    throw error;
                }
                this.logger.error('SAML initialization detected an invalid metadata URL in database. Trying to initialize from metadata in database if available.', { error });
            }
        }
        else if (prefs.metadata) {
            const validationResult = await this.validator.validateMetadata(prefs.metadata);
            if (!validationResult) {
                throw new invalid_saml_metadata_error_1.InvalidSamlMetadataError();
            }
        }
        if ((0, sso_helpers_1.isSamlLoginEnabled)()) {
            if (this._samlPreferences.metadata) {
                const validationResult = await this.validator.validateMetadata(this._samlPreferences.metadata);
                if (!validationResult) {
                    throw new invalid_saml_metadata_error_1.InvalidSamlMetadataError();
                }
            }
            else {
                throw new invalid_saml_metadata_error_1.InvalidSamlMetadataError();
            }
        }
        if (this._samlPreferences.metadata) {
            this.getIdentityProviderInstance(true);
        }
        else {
            this.identityProviderInstance = undefined;
        }
    }
    async loadPreferencesWithoutValidation(prefs) {
        await this.applySamlPreferenceFields(prefs);
        this.applyIdpMetadataPreferences(prefs);
        await (0, saml_helpers_1.setSamlLoginEnabled)(prefs.loginEnabled ?? (0, sso_helpers_1.isSamlLoginEnabled)());
        (0, saml_helpers_1.setSamlLoginLabel)(prefs.loginLabel ?? (0, sso_helpers_1.getSamlLoginLabel)());
    }
    async applySamlPreferenceFields(prefs) {
        this._samlPreferences.loginBinding = prefs.loginBinding ?? this._samlPreferences.loginBinding;
        if (prefs.mapping) {
            this._samlPreferences.mapping = {
                ...prefs.mapping,
                emailVerified: prefs.mapping.emailVerified ?? this._samlPreferences.mapping?.emailVerified,
            };
        }
        this._samlPreferences.ignoreSSL = prefs.ignoreSSL ?? this._samlPreferences.ignoreSSL;
        this._samlPreferences.acsBinding = prefs.acsBinding ?? this._samlPreferences.acsBinding;
        this._samlPreferences.signatureConfig =
            prefs.signatureConfig ?? this._samlPreferences.signatureConfig;
        this._samlPreferences.authnRequestsSigned =
            prefs.authnRequestsSigned ?? this._samlPreferences.authnRequestsSigned;
        this._samlPreferences.wantAssertionsSigned =
            prefs.wantAssertionsSigned ?? this._samlPreferences.wantAssertionsSigned;
        this._samlPreferences.wantMessageSigned =
            prefs.wantMessageSigned ?? this._samlPreferences.wantMessageSigned;
        this._samlPreferences.emailVerifiedRequired =
            prefs.emailVerifiedRequired ?? this._samlPreferences.emailVerifiedRequired;
        if (prefs.signingCertificate === '') {
            this._samlPreferences.signingCertificate = undefined;
        }
        else {
            this._samlPreferences.signingCertificate =
                prefs.signingCertificate ?? this._samlPreferences.signingCertificate;
        }
        if (prefs.signingPrivateKey !== undefined &&
            prefs.signingPrivateKey !== n8n_workflow_1.CREDENTIAL_BLANKING_VALUE) {
            if (prefs.signingPrivateKey === '') {
                this._samlPreferences.signingPrivateKey = undefined;
            }
            else if (this.isValidPemPrivateKey(prefs.signingPrivateKey)) {
                this._samlPreferences.signingPrivateKey = await this.cipher.encryptV2(prefs.signingPrivateKey);
            }
            else {
                this._samlPreferences.signingPrivateKey = prefs.signingPrivateKey;
            }
        }
    }
    applyIdpMetadataPreferences(prefs) {
        if (prefs.metadata !== undefined) {
            this._samlPreferences.metadata = prefs.metadata;
        }
        if (prefs.metadataUrl !== undefined) {
            this._samlPreferences.metadataUrl = prefs.metadataUrl || undefined;
        }
        if (prefs.metadata && !prefs.metadataUrl) {
            this._samlPreferences.metadataUrl = undefined;
        }
    }
    async loadFromDbAndApplySamlPreferences(apply = true, broadcastReload = true) {
        const samlPreferences = await this.settingsRepository.findOne({
            where: { key: constants_1.SAML_PREFERENCES_DB_KEY },
        });
        if (samlPreferences) {
            const prefs = (0, n8n_workflow_1.jsonParse)(samlPreferences.value);
            if (prefs) {
                if (apply) {
                    await this.loadSamlify();
                    const previousMetadataUrl = this._samlPreferences.metadataUrl;
                    await this.loadPreferencesWithoutValidation(prefs);
                    await this.applyLoadedPreferences(prefs, previousMetadataUrl);
                    if (broadcastReload) {
                        await this.broadcastReloadSAMLConfigurationCommand();
                    }
                }
                else {
                    await this.loadPreferencesWithoutValidation(prefs);
                }
                return prefs;
            }
        }
        return;
    }
    async saveSamlPreferencesToDb() {
        const samlPreferences = await this.settingsRepository.findOne({
            where: { key: constants_1.SAML_PREFERENCES_DB_KEY },
        });
        const settingsValue = JSON.stringify(this.samlPreferences);
        let result;
        if (samlPreferences) {
            samlPreferences.value = settingsValue;
            result = await this.settingsRepository.save(samlPreferences, {
                transaction: false,
            });
        }
        else {
            result = await this.settingsRepository.save({
                key: constants_1.SAML_PREFERENCES_DB_KEY,
                value: settingsValue,
                loadOnStartup: true,
            }, { transaction: false });
        }
        if (result)
            return (0, n8n_workflow_1.jsonParse)(result.value);
        return;
    }
    async fetchMetadataFromUrl(metadataUrl, ignoreSSL) {
        await this.loadSamlify();
        const url = metadataUrl ?? this._samlPreferences.metadataUrl;
        const shouldIgnoreSSL = ignoreSSL ?? this._samlPreferences.ignoreSSL;
        if (!url)
            throw new errors_1.BadRequestError('Error fetching SAML Metadata, no Metadata URL set');
        try {
            const response = await this.outboundHttp
                .requests({
                useDefaultSsrfPolicy: 'unsafe',
            })
                .request({
                url,
                method: 'GET',
                skipSslCertificateValidation: shouldIgnoreSSL,
                returnFullResponse: true,
            });
            if (response.statusCode === 200 && response.body) {
                const xml = response.body;
                const validationResult = await this.validator.validateMetadata(xml);
                if (!validationResult) {
                    throw new errors_1.BadRequestError(`Data received from ${url} is not valid SAML metadata.`);
                }
                return xml;
            }
        }
        catch (error) {
            if (error instanceof errors_1.BadRequestError)
                throw error;
            throw new errors_1.BadRequestError(`Error fetching SAML Metadata from ${url}: ${error}`);
        }
        return;
    }
    async getAttributesFromLoginResponse(req, binding, metadataOverride) {
        let parsedSamlResponse;
        if (!this._samlPreferences.mapping)
            throw new errors_1.BadRequestError('Error fetching SAML Attributes, no Attribute mapping set');
        try {
            await this.loadSamlify();
            const idp = metadataOverride
                ? await this.createIdentityProviderFromMetadata(metadataOverride)
                : this.getIdentityProviderInstance();
            const samlRequest = {
                body: req.body,
                query: req.query,
            };
            parsedSamlResponse = await this.getServiceProviderInstance().parseLoginResponse(idp, binding, samlRequest);
        }
        catch (error) {
            throw new errors_1.AuthError(`SAML Authentication failed. Could not parse SAML response. ${error instanceof Error ? error.message : error}`);
        }
        const { attributes, missingAttributes, rawAttributes } = (0, saml_helpers_1.getMappedSamlAttributesFromFlowResult)(parsedSamlResponse, this._samlPreferences.mapping, {
            instanceRole: await this.provisioningService.getInstanceRoleClaimName(),
            projectRoles: await this.provisioningService.getProjectsRolesClaimName(),
        });
        if (!attributes) {
            throw new errors_1.AuthError('SAML Authentication failed. Invalid SAML response.');
        }
        if (missingAttributes.length > 0) {
            throw new errors_1.AuthError(`SAML Authentication failed. Invalid SAML response (missing attributes: ${missingAttributes.join(', ')}).`);
        }
        return { mapped: attributes, raw: rawAttributes };
    }
    async reset() {
        await (0, saml_helpers_1.setSamlLoginEnabled)(false);
        await this.settingsRepository.delete({ key: constants_1.SAML_PREFERENCES_DB_KEY });
    }
};
exports.SamlService = SamlService;
__decorate([
    (0, decorators_1.OnPubSubEvent)('reload-saml-config'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SamlService.prototype, "reload", null);
exports.SamlService = SamlService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, backend_services_1.UrlService, saml_validator_1.SamlValidator, db_1.UserRepository, db_1.SettingsRepository, n8n_core_1.InstanceSettings, provisioning_service_ee_1.ProvisioningService, n8n_core_1.Cipher, backend_services_1.CacheService, backend_network_1.OutboundHttp, db_1.AuthIdentityRepository])
], SamlService);
//# sourceMappingURL=saml.service.ee.js.map