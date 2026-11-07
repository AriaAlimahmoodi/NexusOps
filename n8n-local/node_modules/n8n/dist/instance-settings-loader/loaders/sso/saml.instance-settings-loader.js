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
exports.SamlInstanceSettingsLoader = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const zod_1 = require("zod");
const constants_1 = require("../../../modules/sso-saml/constants");
const instance_bootstrapping_error_1 = require("../../instance-bootstrapping.error");
const samlEnvSchema = zod_1.z
    .object({
    samlMetadata: zod_1.z.string(),
    samlMetadataUrl: zod_1.z.string(),
    samlLoginEnabled: zod_1.z.boolean(),
})
    .refine((data) => data.samlMetadata || data.samlMetadataUrl, {
    message: 'At least one of N8N_SSO_SAML_METADATA or N8N_SSO_SAML_METADATA_URL is required when configuring SAML via environment variables',
})
    .transform(({ samlMetadata, samlMetadataUrl, samlLoginEnabled }) => ({
    ...(samlMetadata ? { metadata: samlMetadata } : {}),
    ...(samlMetadataUrl ? { metadataUrl: samlMetadataUrl } : {}),
    loginEnabled: samlLoginEnabled,
}));
let SamlInstanceSettingsLoader = class SamlInstanceSettingsLoader {
    constructor(config, settingsRepository, logger) {
        this.config = config;
        this.settingsRepository = settingsRepository;
        this.logger = logger;
        this.logger = this.logger.scoped('instance-settings-loader');
    }
    async apply() {
        if (!this.config.samlLoginEnabled) {
            await this.writeLoginDisabled();
            return;
        }
        this.logger.info('SAML login is enabled — applying SAML SSO env vars');
        const parsed = samlEnvSchema.safeParse(this.config);
        if (!parsed.success) {
            throw new instance_bootstrapping_error_1.InstanceBootstrappingError(parsed.error.issues[0].message);
        }
        await this.writePreferences(parsed.data);
    }
    async writePreferences(preferences) {
        await this.settingsRepository.save({
            key: constants_1.SAML_PREFERENCES_DB_KEY,
            value: JSON.stringify(preferences),
            loadOnStartup: true,
        });
    }
    async writeLoginDisabled() {
        await this.settingsRepository.save({
            key: constants_1.SAML_PREFERENCES_DB_KEY,
            value: JSON.stringify({ loginEnabled: false }),
            loadOnStartup: true,
        });
    }
};
exports.SamlInstanceSettingsLoader = SamlInstanceSettingsLoader;
exports.SamlInstanceSettingsLoader = SamlInstanceSettingsLoader = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.InstanceSettingsLoaderConfig, db_1.SettingsRepository, backend_common_1.Logger])
], SamlInstanceSettingsLoader);
//# sourceMappingURL=saml.instance-settings-loader.js.map