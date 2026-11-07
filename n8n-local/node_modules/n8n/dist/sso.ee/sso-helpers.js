"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setCurrentAuthenticationMethod = setCurrentAuthenticationMethod;
exports.reloadAuthenticationMethod = reloadAuthenticationMethod;
exports.getCurrentAuthenticationMethod = getCurrentAuthenticationMethod;
exports.isSamlCurrentAuthenticationMethod = isSamlCurrentAuthenticationMethod;
exports.isSamlLoginEnabled = isSamlLoginEnabled;
exports.getSamlLoginLabel = getSamlLoginLabel;
exports.isSamlLicensed = isSamlLicensed;
exports.isSamlLicensedAndEnabled = isSamlLicensedAndEnabled;
exports.isLdapCurrentAuthenticationMethod = isLdapCurrentAuthenticationMethod;
exports.isOidcCurrentAuthenticationMethod = isOidcCurrentAuthenticationMethod;
exports.isSsoCurrentAuthenticationMethod = isSsoCurrentAuthenticationMethod;
exports.isEmailCurrentAuthenticationMethod = isEmailCurrentAuthenticationMethod;
exports.assertAuthenticationMethodCanBeEnabled = assertAuthenticationMethodCanBeEnabled;
exports.isSsoJustInTimeProvisioningEnabled = isSsoJustInTimeProvisioningEnabled;
exports.doRedirectUsersFromLoginToSsoFlow = doRedirectUsersFromLoginToSsoFlow;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const config_2 = __importDefault(require("../config"));
const errors_1 = require("@n8n/errors");
async function setCurrentAuthenticationMethod(authenticationMethod) {
    config_2.default.set('userManagement.authenticationMethod', authenticationMethod);
    await di_1.Container.get(db_1.SettingsRepository).save({
        key: 'userManagement.authenticationMethod',
        value: authenticationMethod,
        loadOnStartup: true,
    }, { transaction: false });
}
async function reloadAuthenticationMethod() {
    const settings = await di_1.Container.get(db_1.SettingsRepository).findByKey('userManagement.authenticationMethod');
    if (settings) {
        if ((0, db_1.isAuthProviderType)(settings.value)) {
            const authenticationMethod = settings.value;
            config_2.default.set('userManagement.authenticationMethod', authenticationMethod);
            di_1.Container.get(backend_common_1.Logger).debug('Reloaded authentication method from the database', {
                authenticationMethod,
            });
        }
        else {
            di_1.Container.get(backend_common_1.Logger).warn('Invalid authentication method read from the database', {
                value: settings.value,
            });
        }
    }
}
function getCurrentAuthenticationMethod() {
    return config_2.default.getEnv('userManagement.authenticationMethod');
}
function isSamlCurrentAuthenticationMethod() {
    return getCurrentAuthenticationMethod() === 'saml';
}
function isSamlLoginEnabled() {
    return di_1.Container.get(config_1.GlobalConfig).sso.saml.loginEnabled;
}
function getSamlLoginLabel() {
    return di_1.Container.get(config_1.GlobalConfig).sso.saml.loginLabel;
}
function isSamlLicensed() {
    return di_1.Container.get(backend_common_1.LicenseState).isSamlLicensed();
}
function isSamlLicensedAndEnabled() {
    return isSamlLoginEnabled() && isSamlLicensed() && isSamlCurrentAuthenticationMethod();
}
function isLdapCurrentAuthenticationMethod() {
    return getCurrentAuthenticationMethod() === 'ldap';
}
function isOidcCurrentAuthenticationMethod() {
    return getCurrentAuthenticationMethod() === 'oidc';
}
function isSsoCurrentAuthenticationMethod() {
    return (isSamlCurrentAuthenticationMethod() ||
        isLdapCurrentAuthenticationMethod() ||
        isOidcCurrentAuthenticationMethod());
}
function isEmailCurrentAuthenticationMethod() {
    return getCurrentAuthenticationMethod() === 'email';
}
function assertAuthenticationMethodCanBeEnabled(method) {
    const currentAuthenticationMethod = getCurrentAuthenticationMethod();
    if (currentAuthenticationMethod !== 'email' && currentAuthenticationMethod !== method) {
        throw new errors_1.BadRequestError(`Cannot switch ${method} login enabled state when an authentication method other than email or ${method} is active (current: ${currentAuthenticationMethod})`);
    }
}
function isSsoJustInTimeProvisioningEnabled() {
    return di_1.Container.get(config_1.GlobalConfig).sso.justInTimeProvisioning;
}
function doRedirectUsersFromLoginToSsoFlow() {
    return di_1.Container.get(config_1.GlobalConfig).sso.redirectLoginToSso;
}
//# sourceMappingURL=sso-helpers.js.map