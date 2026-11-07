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
exports.LdapService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const lazy_import_1 = require("@n8n/utils/lazy-import");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const errors_1 = require("@n8n/errors");
const sso_helpers_1 = require("../../sso.ee/sso-helpers");
const constants_2 = require("./constants");
const helpers_ee_1 = require("./helpers.ee");
const ldap_errors_1 = require("./ldap.errors");
const LDAP_CONNECTION_ERROR_CODES = new Set([
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'EHOSTUNREACH',
    'ECONNRESET',
    'DEPTH_ZERO_SELF_SIGNED_CERT',
    'SELF_SIGNED_CERT_IN_CHAIN',
    'CERT_HAS_EXPIRED',
    'CERT_NOT_YET_VALID',
    'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
    'UNABLE_TO_GET_ISSUER_CERT',
    'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
]);
let LdapService = class LdapService {
    constructor(logger, settingsRepository, cipher, eventService, licenseState) {
        this.logger = logger;
        this.settingsRepository = settingsRepository;
        this.cipher = cipher;
        this.eventService = eventService;
        this.licenseState = licenseState;
        this.metadata = { name: 'ldap', type: 'password' };
        this.syncTimer = undefined;
        this.userClass = db_1.User;
    }
    async init() {
        const ldapConfig = await this.loadConfig();
        try {
            await this.setGlobalLdapConfigVariables(ldapConfig);
        }
        catch (error) {
            this.logger.warn(`Cannot set LDAP login enabled state when an authentication method other than email or ldap is active (current: ${(0, sso_helpers_1.getCurrentAuthenticationMethod)()})`, error);
        }
        this.setConfig(ldapConfig);
    }
    async loadConfig() {
        const { value } = await this.settingsRepository.findOneByOrFail({
            key: constants_1.LDAP_FEATURE_NAME,
        });
        const ldapConfig = (0, n8n_workflow_1.jsonParse)(value);
        if (ldapConfig.enforceEmailUniqueness === undefined) {
            ldapConfig.enforceEmailUniqueness = true;
        }
        if (ldapConfig.linkExistingAccountsByEmail === undefined) {
            ldapConfig.linkExistingAccountsByEmail = true;
        }
        ldapConfig.bindingAdminPassword = await this.cipher.decryptV2(ldapConfig.bindingAdminPassword);
        return ldapConfig;
    }
    async updateConfig(submittedConfig) {
        let stored;
        if (submittedConfig.bindingAdminPassword === n8n_workflow_1.CREDENTIAL_BLANKING_VALUE) {
            stored = await this.loadConfig();
            submittedConfig.bindingAdminPassword = stored.bindingAdminPassword;
        }
        let { linkExistingAccountsByEmail } = submittedConfig;
        if (linkExistingAccountsByEmail === undefined) {
            stored ??= await this.loadConfig();
            linkExistingAccountsByEmail = stored.linkExistingAccountsByEmail;
        }
        const ldapConfig = Object.assign(submittedConfig, { linkExistingAccountsByEmail });
        const { valid, message } = (0, helpers_ee_1.validateLdapConfigurationSchema)(ldapConfig);
        if (!valid) {
            throw new errors_1.BadRequestError(message);
        }
        if (ldapConfig.loginEnabled) {
            (0, sso_helpers_1.assertAuthenticationMethodCanBeEnabled)('ldap');
        }
        this.setConfig({ ...ldapConfig });
        ldapConfig.bindingAdminPassword = await this.cipher.encryptV2(ldapConfig.bindingAdminPassword);
        if (!ldapConfig.loginEnabled) {
            ldapConfig.synchronizationEnabled = false;
            const ldapUsers = await (0, helpers_ee_1.getLdapUsers)();
            if (ldapUsers.length) {
                await (0, helpers_ee_1.deleteAllLdapIdentities)();
            }
        }
        await this.settingsRepository.update({ key: constants_1.LDAP_FEATURE_NAME }, { value: JSON.stringify(ldapConfig), loadOnStartup: true });
        await this.setGlobalLdapConfigVariables(ldapConfig);
    }
    setConfig(ldapConfig) {
        this.config = ldapConfig;
        this.client = undefined;
        if (this.syncTimer && !this.config.synchronizationEnabled) {
            this.stopSync();
        }
        else if (!this.syncTimer && this.config.synchronizationEnabled) {
            this.scheduleSync();
        }
        else if (this.syncTimer && this.config.synchronizationEnabled) {
            this.stopSync();
            this.scheduleSync();
        }
    }
    async setGlobalLdapConfigVariables(ldapConfig) {
        await this.setLdapLoginEnabled(ldapConfig.loginEnabled);
        di_1.Container.get(config_1.GlobalConfig).sso.ldap.loginLabel = ldapConfig.loginLabel;
    }
    async setLdapLoginEnabled(enabled) {
        const currentAuthenticationMethod = (0, sso_helpers_1.getCurrentAuthenticationMethod)();
        if (enabled) {
            (0, sso_helpers_1.assertAuthenticationMethodCanBeEnabled)('ldap');
        }
        di_1.Container.get(config_1.GlobalConfig).sso.ldap.loginEnabled = enabled;
        const targetAuthenticationMethod = !enabled && currentAuthenticationMethod === 'ldap' ? 'email' : currentAuthenticationMethod;
        await (0, sso_helpers_1.setCurrentAuthenticationMethod)(enabled ? 'ldap' : targetAuthenticationMethod);
    }
    async getClient() {
        if (this.config === undefined) {
            throw new n8n_workflow_1.UnexpectedError('Service cannot be used without setting the property config');
        }
        if (this.client === undefined) {
            if (!this.ldapts) {
                this.ldapts = await (0, lazy_import_1.lazyImport)(async () => await import('ldapts'));
            }
            const url = (0, helpers_ee_1.formatUrl)(this.config.connectionUrl, this.config.connectionPort, this.config.connectionSecurity);
            const ldapOptions = { url };
            const tlsOptions = {};
            if (this.config.connectionSecurity !== 'none') {
                Object.assign(tlsOptions, {
                    rejectUnauthorized: !this.config.allowUnauthorizedCerts,
                });
                if (this.config.connectionSecurity === 'tls') {
                    ldapOptions.tlsOptions = tlsOptions;
                }
            }
            this.client = new this.ldapts.Client(ldapOptions);
            if (this.config.connectionSecurity === 'startTls') {
                await this.client.startTLS(tlsOptions);
            }
        }
    }
    async bindAdmin() {
        await this.getClient();
        if (this.client) {
            await this.client.bind(this.config.bindingAdminDn, this.config.bindingAdminPassword);
        }
    }
    async searchWithAdminBinding(filter) {
        await this.bindAdmin();
        if (this.client) {
            const { searchEntries } = await this.client.search(this.config.baseDn, {
                attributes: (0, helpers_ee_1.getMappingAttributes)(this.config),
                explicitBufferAttributes: constants_2.BINARY_AD_ATTRIBUTES,
                filter,
                timeLimit: this.config.searchTimeout,
                paged: { pageSize: this.config.searchPageSize },
                ...(this.config.searchPageSize === 0 && { paged: true }),
            });
            await this.client.unbind();
            return searchEntries;
        }
        return [];
    }
    async hasEmailDuplicatesInLdap(email) {
        try {
            const searchResults = await this.searchWithAdminBinding((0, helpers_ee_1.createFilter)(`(${this.config.emailAttribute}=${(0, helpers_ee_1.escapeFilter)(email)})`, this.config.userFilter));
            return searchResults.length > 1;
        }
        catch (error) {
            this.logger.error('LDAP - Error checking for duplicate emails', {
                email,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return true;
        }
    }
    async validUser(dn, password) {
        await this.getClient();
        if (this.client) {
            await this.client.bind(dn, password);
            await this.client.unbind();
        }
    }
    async findAndAuthenticateLdapUser(loginId, password, loginIdAttribute, userFilter) {
        let searchResult = [];
        try {
            searchResult = await this.searchWithAdminBinding((0, helpers_ee_1.createFilter)(`(${loginIdAttribute}=${(0, helpers_ee_1.escapeFilter)(loginId)})`, userFilter));
        }
        catch (e) {
            if (e instanceof Error) {
                this.eventService.emit('ldap-login-sync-failed', { error: e.message });
                this.logger.error('LDAP - Error during search', { message: e.message });
            }
            return undefined;
        }
        if (!searchResult.length) {
            return undefined;
        }
        let user = searchResult.pop();
        if (user === undefined) {
            user = { dn: '' };
        }
        try {
            await this.validUser(user.dn, password);
        }
        catch (e) {
            if (e instanceof Error) {
                this.logger.error('LDAP - Error validating user against LDAP server', {
                    message: e.message,
                });
            }
            return undefined;
        }
        (0, helpers_ee_1.resolveEntryBinaryAttributes)(user);
        return user;
    }
    async testConnection() {
        await this.bindAdmin();
    }
    scheduleSync() {
        if (!this.config.synchronizationInterval) {
            throw new n8n_workflow_1.UnexpectedError('Interval variable has to be defined');
        }
        this.syncTimer = setInterval(async () => {
            await this.runSync('live');
        }, this.config.synchronizationInterval * 60000);
    }
    async getSynchronizations(offset, limit) {
        return await (0, helpers_ee_1.getLdapSynchronizationsWithCount)(offset, limit);
    }
    async runSync(mode) {
        this.logger.debug(`LDAP - Starting a synchronization run in ${mode} mode`);
        let adUsers = [];
        try {
            adUsers = await this.searchWithAdminBinding((0, helpers_ee_1.createFilter)(`(${this.config.loginIdAttribute}=*)`, this.config.userFilter));
            this.logger.debug('LDAP - Users return by the query', {
                users: adUsers,
            });
            (0, helpers_ee_1.resolveBinaryAttributes)(adUsers);
        }
        catch (e) {
            if (e instanceof Error) {
                this.logger.error(`LDAP - ${e.message}`);
                if (this.ldapts && e instanceof this.ldapts.ResultCodeError) {
                    throw new ldap_errors_1.LdapRejectionError(e.message);
                }
                if ('code' in e &&
                    LDAP_CONNECTION_ERROR_CODES.has(e.code ?? '')) {
                    throw new ldap_errors_1.LdapConnectionError(e.message);
                }
                throw e;
            }
        }
        const startedAt = new Date();
        const localAdUsers = await (0, helpers_ee_1.getLdapIds)();
        const processableAdUsers = this.config.enforceEmailUniqueness
            ? this.filterEmailDuplicates(adUsers)
            : adUsers;
        const { usersToCreate, usersToUpdate, usersToDisable } = this.getUsersToProcess(processableAdUsers, localAdUsers);
        const filteredUsersToCreate = usersToCreate.filter(([id, user]) => {
            if (!(0, db_1.isValidEmail)(user.email)) {
                this.logger.warn(`LDAP - Invalid email format for user ${id}`);
                return false;
            }
            return true;
        });
        const filteredUsersToUpdate = usersToUpdate.filter(([id, user]) => {
            if (!(0, db_1.isValidEmail)(user.email)) {
                this.logger.warn(`LDAP - Invalid email format for user ${id}`);
                return false;
            }
            return true;
        });
        const processableUsersToCreate = this.config.linkExistingAccountsByEmail
            ? filteredUsersToCreate
            : await this.filterExistingAccounts(filteredUsersToCreate);
        this.logger.debug('LDAP - Users to process', {
            created: processableUsersToCreate.length,
            updated: filteredUsersToUpdate.length,
            disabled: usersToDisable.length,
        });
        const endedAt = new Date();
        let status = 'success';
        let errorMessage = '';
        try {
            if (mode === 'live') {
                await (0, helpers_ee_1.processUsers)(processableUsersToCreate, filteredUsersToUpdate, usersToDisable, this.config.linkExistingAccountsByEmail);
            }
        }
        catch (error) {
            status = 'error';
            errorMessage = error instanceof Error ? error.message : String(error);
        }
        const syncHistory = await (0, helpers_ee_1.saveLdapSynchronization)({
            startedAt,
            endedAt,
            created: processableUsersToCreate.length,
            updated: filteredUsersToUpdate.length,
            disabled: usersToDisable.length,
            scanned: adUsers.length,
            runMode: mode,
            status,
            error: errorMessage,
        });
        this.eventService.emit('ldap-general-sync-finished', {
            type: !this.syncTimer ? 'scheduled' : `manual_${mode}`,
            succeeded: status === 'success',
            usersSynced: processableUsersToCreate.length + filteredUsersToUpdate.length + usersToDisable.length,
            error: errorMessage,
        });
        if (status === 'success') {
            this.logger.debug('LDAP - Synchronization finished successfully');
        }
        else {
            this.logger.error('LDAP - Synchronization finished with errors', { error: errorMessage });
        }
        return syncHistory;
    }
    stopSync() {
        clearInterval(this.syncTimer);
        this.syncTimer = undefined;
    }
    getUsersToProcess(adUsers, localAdUsers) {
        return {
            usersToCreate: this.getUsersToCreate(adUsers, localAdUsers),
            usersToUpdate: this.getUsersToUpdate(adUsers, localAdUsers),
            usersToDisable: this.getUsersToDisable(adUsers, localAdUsers),
        };
    }
    filterEmailDuplicates(adUsers) {
        const emailCounts = new Map();
        for (const adUser of adUsers) {
            const email = adUser[this.config.emailAttribute];
            if (!email)
                continue;
            emailCounts.set(email, (emailCounts.get(email) ?? 0) + 1);
        }
        return adUsers.filter((adUser) => {
            const email = adUser[this.config.emailAttribute];
            if (email && (emailCounts.get(email) ?? 0) > 1) {
                this.logger.warn('LDAP sync skipped entry: multiple LDAP accounts share the same email', {
                    email,
                    ldapId: adUser[this.config.ldapIdAttribute],
                });
                return false;
            }
            return true;
        });
    }
    async filterExistingAccounts(usersToCreate) {
        if (usersToCreate.length === 0)
            return usersToCreate;
        const userRepository = di_1.Container.get(db_1.UserRepository);
        const existingEmails = new Set();
        for (const emails of (0, db_1.chunkIds)(usersToCreate.map(([, user]) => user.email))) {
            const existingUsers = await userRepository.findManyByEmail(emails);
            for (const user of existingUsers)
                existingEmails.add(user.email);
        }
        return usersToCreate.filter(([ldapId, user]) => {
            if (existingEmails.has(user.email)) {
                this.logger.warn('LDAP sync skipped entry: email matches an existing account', {
                    email: user.email,
                    ldapId,
                });
                return false;
            }
            return true;
        });
    }
    getUsersToCreate(remoteAdUsers, localLdapIds) {
        return remoteAdUsers
            .filter((adUser) => !localLdapIds.includes(adUser[this.config.ldapIdAttribute]))
            .map((adUser) => (0, helpers_ee_1.mapLdapUserToDbUser)(adUser, this.config, true));
    }
    getUsersToUpdate(remoteAdUsers, localLdapIds) {
        return remoteAdUsers
            .filter((adUser) => localLdapIds.includes(adUser[this.config.ldapIdAttribute]))
            .map((adUser) => (0, helpers_ee_1.mapLdapUserToDbUser)(adUser, this.config));
    }
    getUsersToDisable(remoteAdUsers, localLdapIds) {
        const remoteAdUserIds = remoteAdUsers.map((adUser) => adUser[this.config.ldapIdAttribute]);
        return localLdapIds.filter((user) => !remoteAdUserIds.includes(user));
    }
    async handleLogin(loginId, password) {
        if (!this.licenseState.isLdapLicensed())
            return undefined;
        if (!this.config.loginEnabled)
            return undefined;
        const { loginIdAttribute, userFilter } = this.config;
        const ldapUser = await this.findAndAuthenticateLdapUser(loginId, password, loginIdAttribute, userFilter);
        if (!ldapUser)
            return undefined;
        const [ldapId, ldapAttributesValues] = (0, helpers_ee_1.mapLdapAttributesToUser)(ldapUser, this.config);
        const { email: emailAttributeValue } = ldapAttributesValues;
        if (!ldapId || !emailAttributeValue)
            return undefined;
        const ldapAuthIdentity = await (0, helpers_ee_1.getAuthIdentityByLdapId)(ldapId);
        if (!ldapAuthIdentity) {
            if (this.config.enforceEmailUniqueness) {
                const hasDuplicates = await this.hasEmailDuplicatesInLdap(emailAttributeValue);
                if (hasDuplicates) {
                    this.logger.warn('LDAP login blocked: Multiple LDAP accounts share the same email', {
                        email: emailAttributeValue,
                        ldapId,
                    });
                    return undefined;
                }
            }
            const emailUser = await (0, helpers_ee_1.getUserByEmail)(emailAttributeValue);
            if (emailUser && emailUser.email === emailAttributeValue) {
                if (!this.config.linkExistingAccountsByEmail) {
                    this.logger.warn('LDAP login blocked: email matches an existing account', {
                        email: emailAttributeValue,
                        ldapId,
                    });
                    return undefined;
                }
                const identity = await (0, helpers_ee_1.createLdapAuthIdentity)(emailUser, ldapId);
                await (0, helpers_ee_1.updateLdapUserOnLocalDb)(identity, ldapAttributesValues);
            }
            else {
                const user = await (0, helpers_ee_1.createLdapUserOnLocalDb)(ldapAttributesValues, ldapId);
                di_1.Container.get(backend_services_1.EventService).emit('user-signed-up', {
                    user,
                    userType: 'ldap',
                    wasDisabledLdapUser: false,
                });
                return user;
            }
        }
        else {
            if (ldapAuthIdentity.user) {
                if (ldapAuthIdentity.user.disabled)
                    return undefined;
                await (0, helpers_ee_1.updateLdapUserOnLocalDb)(ldapAuthIdentity, ldapAttributesValues);
            }
        }
        return (await (0, helpers_ee_1.getUserByLdapId)(ldapId)) ?? undefined;
    }
};
exports.LdapService = LdapService;
exports.LdapService = LdapService = __decorate([
    (0, decorators_1.AuthHandler)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, db_1.SettingsRepository, n8n_core_1.Cipher, backend_services_1.EventService, backend_common_1.LicenseState])
], LdapService);
//# sourceMappingURL=ldap.service.ee.js.map