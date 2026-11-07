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
exports.License = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const license_sdk_1 = require("@n8n_io/license-sdk");
const n8n_core_1 = require("n8n-core");
const license_metrics_service_1 = require("./metrics/license-metrics.service");
const constants_2 = require("./constants");
const LICENSE_RENEWAL_DISABLED_WARNING = 'Automatic license renewal is disabled. The license will not renew automatically, and access to licensed features may be lost!';
const MIN_DEVICE_FINGERPRINT_LENGTH = 32;
let License = class License {
    constructor(logger, instanceSettings, settingsRepository, licenseMetricsService, globalConfig) {
        this.logger = logger;
        this.instanceSettings = instanceSettings;
        this.settingsRepository = settingsRepository;
        this.licenseMetricsService = licenseMetricsService;
        this.globalConfig = globalConfig;
        this.isShuttingDown = false;
        this.refreshCallbacks = [];
        this.hasWarnedShortDeviceFingerprint = false;
        this.logger = this.logger.scoped('license');
    }
    async init({ forceRecreate = false, isCli = false, } = {}) {
        if (this.manager && !forceRecreate) {
            this.logger.warn('License manager already initialized or shutting down');
            return;
        }
        if (this.isShuttingDown) {
            this.logger.warn('License manager already shutting down');
            return;
        }
        const { instanceType } = this.instanceSettings;
        const isMainInstance = instanceType === 'main';
        const server = this.globalConfig.license.serverUrl;
        const offlineMode = !isMainInstance;
        const autoRenewOffset = 72 * constants_1.Time.hours.toSeconds;
        const saveCertStr = isMainInstance
            ? async (value) => await this.saveCertStr(value)
            : async () => { };
        const onFeatureChange = isMainInstance
            ? async () => await this.onFeatureChange()
            : async () => { };
        const onLicenseRenewed = isMainInstance
            ? async () => await this.onLicenseRenewed()
            : async () => { };
        const collectUsageMetrics = isMainInstance
            ? async () => await this.licenseMetricsService.collectUsageMetrics()
            : async () => [];
        const collectPassthroughData = isMainInstance
            ? async () => await this.licenseMetricsService.collectPassthroughData()
            : async () => ({});
        const onExpirySoon = !this.instanceSettings.isLeader ? () => this.onExpirySoon() : undefined;
        const expirySoonOffsetMins = !this.instanceSettings.isLeader ? 120 : undefined;
        const { isLeader } = this.instanceSettings;
        const { autoRenewalEnabled } = this.globalConfig.license;
        const eligibleToRenew = isCli || isLeader;
        const shouldRenew = eligibleToRenew && autoRenewalEnabled;
        if (eligibleToRenew && !autoRenewalEnabled) {
            this.logger.warn(LICENSE_RENEWAL_DISABLED_WARNING);
        }
        try {
            this.manager = new license_sdk_1.LicenseManager({
                server,
                tenantId: this.globalConfig.license.tenantId,
                productIdentifier: `n8n-${constants_2.N8N_VERSION}`,
                autoRenewEnabled: autoRenewalEnabled,
                autoRenewTimer: false,
                renewOnInit: shouldRenew,
                autoRenewOffset,
                detachFloatingOnShutdown: this.globalConfig.license.detachFloatingOnShutdown && !this.instanceSettings.isMultiMain,
                offlineMode,
                logger: this.logger,
                loadCertStr: async () => await this.loadCertStr(),
                saveCertStr,
                deviceFingerprint: () => this.deviceFingerprint(),
                collectUsageMetrics,
                collectPassthroughData,
                onFeatureChange,
                onLicenseRenewed,
                onExpirySoon,
                expirySoonOffsetMins,
            });
            await this.manager.initialize();
            this.logger.debug('License initialized');
        }
        catch (error) {
            if (error instanceof Error) {
                this.logger.error('Could not initialize license manager sdk', { error });
            }
        }
    }
    deviceFingerprint() {
        const { instanceId, derivedInstanceId } = this.instanceSettings;
        if (instanceId.length >= MIN_DEVICE_FINGERPRINT_LENGTH)
            return instanceId;
        if (!this.hasWarnedShortDeviceFingerprint) {
            this.hasWarnedShortDeviceFingerprint = true;
            this.logger.warn(`Instance ID is shorter than ${MIN_DEVICE_FINGERPRINT_LENGTH} characters, so it cannot be used as the license device fingerprint. Falling back to the encryption-key-derived ID. Check the N8N_INSTANCE_ID env var and the 'instance.id' deployment key.`);
        }
        return derivedInstanceId;
    }
    async loadCertStr() {
        const ephemeralLicense = this.globalConfig.license.cert;
        if (ephemeralLicense) {
            return ephemeralLicense;
        }
        const databaseSettings = await this.settingsRepository.findOne({
            where: {
                key: constants_2.SETTINGS_LICENSE_CERT_KEY,
            },
        });
        return databaseSettings?.value ?? '';
    }
    async onFeatureChange() {
        if (this.instanceSettings.isLeader) {
            void this.broadcastReloadLicenseCommand();
        }
        await this.notifyRefreshCallbacks();
    }
    async onLicenseRenewed() {
        void this.broadcastReloadLicenseCommand();
        await this.notifyRefreshCallbacks();
    }
    async broadcastReloadLicenseCommand() {
        if (this.globalConfig.executions.mode === 'queue') {
            const { Publisher } = await import('./scaling/pubsub/publisher.service.js');
            await di_1.Container.get(Publisher).publishCommand({ command: 'reload-license' });
        }
    }
    async saveCertStr(value) {
        if (this.globalConfig.license.cert)
            return;
        await this.settingsRepository.upsert({
            key: constants_2.SETTINGS_LICENSE_CERT_KEY,
            value,
            loadOnStartup: false,
        }, ['key']);
    }
    onCertRefresh(refreshCallback) {
        this.refreshCallbacks.push(refreshCallback);
        return () => {
            const index = this.refreshCallbacks.indexOf(refreshCallback);
            if (index > -1) {
                this.refreshCallbacks.splice(index, 1);
            }
        };
    }
    async notifyRefreshCallbacks() {
        const cert = await this.loadCertStr();
        for (const refreshCallback of this.refreshCallbacks) {
            try {
                refreshCallback(cert);
            }
            catch (error) {
                this.logger.error('Error in license refresh callback', { error });
            }
        }
    }
    async activate(activationKey, eulaUri, userEmail) {
        if (!this.manager) {
            return;
        }
        await this.manager.activate(activationKey, { eulaUri, email: userEmail });
        this.logger.debug('License activated');
    }
    async reload() {
        if (!this.manager) {
            return;
        }
        try {
            await this.manager.reloadStoredCert();
        }
        catch (error) {
            this.logger.warn('Failed to reload the stored license cert', {
                error: (0, ensure_error_1.ensureError)(error).message,
            });
            return;
        }
        await this.notifyRefreshCallbacks();
        this.logger.debug('License reloaded');
    }
    async renewIfDue() {
        await this.manager?.renewIfDue();
    }
    async renew() {
        if (!this.manager) {
            return;
        }
        await this.manager.renew();
        this.logger.debug('License renewed');
    }
    async clear() {
        if (!this.manager) {
            return;
        }
        await this.manager.clear();
        this.logger.info('License cleared');
    }
    async shutdown() {
        this.isShuttingDown = true;
        if (!this.manager) {
            return;
        }
        await this.manager.shutdown();
        this.logger.debug('License shut down');
    }
    isLicensed(feature) {
        return this.manager?.hasFeatureEnabled(feature) ?? false;
    }
    isCertValid() {
        return this.manager?.isValid(false) ?? false;
    }
    hasFeatureInCert(feature) {
        return this.manager?.hasFeatureEnabled(feature, false) ?? false;
    }
    isDynamicCredentialsEnabled() {
        return this.isLicensed(constants_1.LICENSE_FEATURES.DYNAMIC_CREDENTIALS);
    }
    isSharingEnabled() {
        return this.isLicensed(constants_1.LICENSE_FEATURES.SHARING);
    }
    isLogStreamingEnabled() {
        return this.isLicensed(constants_1.LICENSE_FEATURES.LOG_STREAMING);
    }
    isLdapEnabled() {
        return this.isLicensed(constants_1.LICENSE_FEATURES.LDAP);
    }
    isSamlEnabled() {
        return this.isLicensed(constants_1.LICENSE_FEATURES.SAML);
    }
    isAiAssistantEnabled() {
        return this.isLicensed(constants_1.LICENSE_FEATURES.AI_ASSISTANT);
    }
    isAskAiEnabled() {
        return this.isLicensed(constants_1.LICENSE_FEATURES.ASK_AI);
    }
    isAiCreditsEnabled() {
        return this.isLicensed(constants_1.LICENSE_FEATURES.AI_CREDITS);
    }
    isAdvancedExecutionFiltersEnabled() {
        return this.isLicensed(constants_1.LICENSE_FEATURES.ADVANCED_EXECUTION_FILTERS);
    }
    isAdvancedPermissionsLicensed() {
        return this.isLicensed(constants_1.LICENSE_FEATURES.ADVANCED_PERMISSIONS);
    }
    isDebugInEditorLicensed() {
        return this.isLicensed(constants_1.LICENSE_FEATURES.DEBUG_IN_EDITOR);
    }
    isBinaryDataS3Licensed() {
        return this.isLicensed(constants_1.LICENSE_FEATURES.BINARY_DATA_S3);
    }
    isMultiMainLicensed() {
        return this.isLicensed(constants_1.LICENSE_FEATURES.MULTIPLE_MAIN_INSTANCES);
    }
    isVariablesEnabled() {
        return this.isLicensed(constants_1.LICENSE_FEATURES.VARIABLES);
    }
    isSourceControlLicensed() {
        return this.isLicensed(constants_1.LICENSE_FEATURES.SOURCE_CONTROL);
    }
    isExternalSecretsEnabled() {
        return this.isLicensed(constants_1.LICENSE_FEATURES.EXTERNAL_SECRETS);
    }
    isAPIDisabled() {
        return this.isLicensed(constants_1.LICENSE_FEATURES.API_DISABLED);
    }
    isWorkerViewLicensed() {
        return this.isLicensed(constants_1.LICENSE_FEATURES.WORKER_VIEW);
    }
    isProjectRoleAdminLicensed() {
        return this.isLicensed(constants_1.LICENSE_FEATURES.PROJECT_ROLE_ADMIN);
    }
    isProjectRoleEditorLicensed() {
        return this.isLicensed(constants_1.LICENSE_FEATURES.PROJECT_ROLE_EDITOR);
    }
    isProjectRoleViewerLicensed() {
        return this.isLicensed(constants_1.LICENSE_FEATURES.PROJECT_ROLE_VIEWER);
    }
    isCustomNpmRegistryEnabled() {
        return this.isLicensed(constants_1.LICENSE_FEATURES.COMMUNITY_NODES_CUSTOM_REGISTRY);
    }
    isFoldersEnabled() {
        return this.isLicensed(constants_1.LICENSE_FEATURES.FOLDERS);
    }
    getCurrentEntitlements() {
        return this.manager?.getCurrentEntitlements() ?? [];
    }
    getValue(feature) {
        return this.manager?.getFeatureValue(feature);
    }
    getManagementJwt() {
        if (!this.manager) {
            return '';
        }
        return this.manager.getManagementJwt();
    }
    getMainPlan() {
        if (!this.manager) {
            return undefined;
        }
        const entitlements = this.getCurrentEntitlements();
        if (!entitlements.length) {
            return undefined;
        }
        entitlements.sort((a, b) => b.validFrom.getTime() - a.validFrom.getTime());
        return entitlements.find((entitlement) => entitlement.productMetadata?.terms?.isMainPlan);
    }
    getConsumerId() {
        return this.manager?.getConsumerId() ?? 'unknown';
    }
    getUsersLimit() {
        return this.getValue(constants_1.LICENSE_QUOTAS.USERS_LIMIT) ?? constants_1.UNLIMITED_LICENSE_QUOTA;
    }
    getTriggerLimit() {
        return this.getValue(constants_1.LICENSE_QUOTAS.TRIGGER_LIMIT) ?? constants_1.UNLIMITED_LICENSE_QUOTA;
    }
    getVariablesLimit() {
        return this.getValue(constants_1.LICENSE_QUOTAS.VARIABLES_LIMIT) ?? constants_1.UNLIMITED_LICENSE_QUOTA;
    }
    getAiCredits() {
        return this.getValue(constants_1.LICENSE_QUOTAS.AI_CREDITS) ?? 0;
    }
    getWorkflowHistoryPruneLimit() {
        return (this.getValue(constants_1.LICENSE_QUOTAS.WORKFLOW_HISTORY_PRUNE_LIMIT) ??
            constants_1.DEFAULT_WORKFLOW_HISTORY_PRUNE_LIMIT);
    }
    getTeamProjectLimit() {
        return this.getValue(constants_1.LICENSE_QUOTAS.TEAM_PROJECT_LIMIT) ?? 0;
    }
    getPlanName() {
        return this.getValue('planName') ?? 'Community';
    }
    getExpiryDate() {
        try {
            return this.manager?.getExpiryDate() ?? null;
        }
        catch {
            return null;
        }
    }
    getTerminationDate() {
        try {
            return this.manager?.getTerminationDate() ?? null;
        }
        catch {
            return null;
        }
    }
    getExpiringInDays() {
        const expiryDate = this.getExpiryDate();
        if (!expiryDate)
            return undefined;
        const expiryTime = expiryDate.getTime();
        if (Number.isNaN(expiryTime))
            return undefined;
        const now = new Date();
        const diffMs = expiryTime - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
    }
    getTerminatingInDays() {
        const terminationDate = this.getTerminationDate();
        if (!terminationDate)
            return undefined;
        const terminationTime = terminationDate.getTime();
        if (Number.isNaN(terminationTime))
            return undefined;
        const now = new Date();
        const diffMs = terminationTime - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
    }
    getInfo() {
        if (!this.manager) {
            return 'n/a';
        }
        return this.manager.toString();
    }
    isWithinUsersLimit() {
        return this.getUsersLimit() === constants_1.UNLIMITED_LICENSE_QUOTA;
    }
    onExpirySoon() {
        this.logger.info('License is about to expire soon, reloading license...');
        void this.reload()
            .then(() => {
            this.logger.info('Reloaded license on expiry soon');
        })
            .catch((error) => {
            this.logger.error('Failed to reload license on expiry soon', {
                error: error instanceof Error ? error.message : error,
            });
        });
    }
};
exports.License = License;
__decorate([
    (0, decorators_1.OnPubSubEvent)('reload-license'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], License.prototype, "reload", null);
__decorate([
    (0, decorators_1.OnShutdown)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], License.prototype, "shutdown", null);
exports.License = License = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, n8n_core_1.InstanceSettings, db_1.SettingsRepository, license_metrics_service_1.LicenseMetricsService, config_1.GlobalConfig])
], License);
//# sourceMappingURL=license.js.map