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
exports.OidcInstanceSettingsLoader = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const zod_1 = require("zod");
const constants_1 = require("../../../modules/sso-oidc/constants");
const instance_bootstrapping_error_1 = require("../../instance-bootstrapping.error");
const oidcEnvSchema = zod_1.z
    .object({
    oidcClientId: zod_1.z
        .string()
        .min(1, 'N8N_SSO_OIDC_CLIENT_ID is required when configuring OIDC via environment variables'),
    oidcClientSecret: zod_1.z
        .string()
        .min(1, 'N8N_SSO_OIDC_CLIENT_SECRET is required when configuring OIDC via environment variables'),
    oidcDiscoveryEndpoint: zod_1.z.string().url('N8N_SSO_OIDC_DISCOVERY_ENDPOINT must be a valid URL'),
    oidcLoginEnabled: zod_1.z.boolean(),
    oidcPrompt: zod_1.z.enum(api_types_1.OIDC_PROMPT_VALUES, {
        errorMap: () => ({
            message: `N8N_SSO_OIDC_PROMPT must be one of: ${api_types_1.OIDC_PROMPT_VALUES.join(', ')}`,
        }),
    }),
    oidcAcrValues: zod_1.z.string(),
    oidcAdditionalScopes: zod_1.z.string(),
    oidcRpInitiatedLogoutEnabled: zod_1.z.boolean(),
})
    .transform((input) => ({
    clientId: input.oidcClientId,
    clientSecret: input.oidcClientSecret,
    discoveryEndpoint: input.oidcDiscoveryEndpoint,
    loginEnabled: input.oidcLoginEnabled,
    prompt: input.oidcPrompt,
    authenticationContextClassReference: input.oidcAcrValues
        ? input.oidcAcrValues
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean)
        : [],
    additionalScopes: input.oidcAdditionalScopes,
    rpInitiatedLogoutEnabled: input.oidcRpInitiatedLogoutEnabled,
}));
let OidcInstanceSettingsLoader = class OidcInstanceSettingsLoader {
    constructor(config, settingsRepository, cipher, logger) {
        this.config = config;
        this.settingsRepository = settingsRepository;
        this.cipher = cipher;
        this.logger = logger;
        this.logger = this.logger.scoped('instance-settings-loader');
    }
    async apply() {
        if (!this.config.oidcLoginEnabled) {
            await this.writeLoginDisabled();
            return;
        }
        this.logger.info('OIDC login is enabled — applying OIDC SSO env vars');
        const parsed = oidcEnvSchema.safeParse(this.config);
        if (!parsed.success) {
            throw new instance_bootstrapping_error_1.InstanceBootstrappingError(parsed.error.issues[0].message);
        }
        await this.writePreferences(parsed.data);
    }
    async writePreferences(preferences) {
        await this.settingsRepository.upsert({
            key: constants_1.OIDC_PREFERENCES_DB_KEY,
            value: JSON.stringify({
                ...preferences,
                clientSecret: await this.cipher.encryptV2(preferences.clientSecret),
            }),
            loadOnStartup: true,
        }, { conflictPaths: ['key'] });
    }
    async writeLoginDisabled() {
        await this.settingsRepository.upsert({
            key: constants_1.OIDC_PREFERENCES_DB_KEY,
            value: JSON.stringify({ loginEnabled: false }),
            loadOnStartup: true,
        }, { conflictPaths: ['key'] });
    }
};
exports.OidcInstanceSettingsLoader = OidcInstanceSettingsLoader;
exports.OidcInstanceSettingsLoader = OidcInstanceSettingsLoader = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.InstanceSettingsLoaderConfig, db_1.SettingsRepository, n8n_core_1.Cipher, backend_common_1.Logger])
], OidcInstanceSettingsLoader);
//# sourceMappingURL=oidc.instance-settings-loader.js.map