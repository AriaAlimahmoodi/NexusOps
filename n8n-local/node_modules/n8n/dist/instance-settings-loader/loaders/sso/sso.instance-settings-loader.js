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
exports.SsoInstanceSettingsLoader = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const sso_helpers_1 = require("../../../sso.ee/sso-helpers");
const oidc_instance_settings_loader_1 = require("./oidc.instance-settings-loader");
const provisioning_instance_settings_loader_1 = require("./provisioning.instance-settings-loader");
const saml_instance_settings_loader_1 = require("./saml.instance-settings-loader");
const instance_bootstrapping_error_1 = require("../../instance-bootstrapping.error");
let SsoInstanceSettingsLoader = class SsoInstanceSettingsLoader {
    constructor(config, samlLoader, oidcLoader, provisioningLoader, logger) {
        this.config = config;
        this.samlLoader = samlLoader;
        this.oidcLoader = oidcLoader;
        this.provisioningLoader = provisioningLoader;
        this.logger = logger;
        this.logger = this.logger.scoped('instance-settings-loader');
    }
    async run() {
        if (!this.config.ssoManagedByEnv) {
            this.logger.debug('ssoManagedByEnv is disabled — skipping SSO config');
            return 'skipped';
        }
        const { samlLoginEnabled, oidcLoginEnabled } = this.config;
        if (samlLoginEnabled && oidcLoginEnabled) {
            throw new instance_bootstrapping_error_1.InstanceBootstrappingError('N8N_SSO_SAML_LOGIN_ENABLED and N8N_SSO_OIDC_LOGIN_ENABLED cannot both be true. Only one SSO protocol can be enabled at a time.');
        }
        await this.samlLoader.apply();
        await this.oidcLoader.apply();
        if (samlLoginEnabled || oidcLoginEnabled) {
            await this.provisioningLoader.apply();
        }
        await this.syncAuthMethod();
        return 'created';
    }
    async syncAuthMethod() {
        const { samlLoginEnabled, oidcLoginEnabled } = this.config;
        if (samlLoginEnabled) {
            await (0, sso_helpers_1.setCurrentAuthenticationMethod)('saml');
            this.logger.debug('Switching authentication method to SAML. Current authentication method: saml');
            return;
        }
        if (oidcLoginEnabled) {
            await (0, sso_helpers_1.setCurrentAuthenticationMethod)('oidc');
            this.logger.debug('Switching authentication method to OIDC. Current authentication method: oidc');
            return;
        }
        const current = (0, sso_helpers_1.getCurrentAuthenticationMethod)();
        if (current === 'saml' || current === 'oidc') {
            await (0, sso_helpers_1.setCurrentAuthenticationMethod)('email');
            this.logger.debug(`Switching authentication method to email because SAML or OIDC is disabled. Current authentication method: ${current}`);
        }
    }
};
exports.SsoInstanceSettingsLoader = SsoInstanceSettingsLoader;
exports.SsoInstanceSettingsLoader = SsoInstanceSettingsLoader = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.InstanceSettingsLoaderConfig, saml_instance_settings_loader_1.SamlInstanceSettingsLoader, oidc_instance_settings_loader_1.OidcInstanceSettingsLoader, provisioning_instance_settings_loader_1.ProvisioningInstanceSettingsLoader, backend_common_1.Logger])
], SsoInstanceSettingsLoader);
//# sourceMappingURL=sso.instance-settings-loader.js.map