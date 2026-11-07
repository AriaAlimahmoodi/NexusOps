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
exports.DynamicCredentialsModule = void 0;
const backend_common_1 = require("@n8n/backend-common");
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
function isExternalResolversEnabled() {
    return (0, backend_common_1.isEnvFeatureEnabled)('N8N_ENV_FEAT_DYNAMIC_CREDENTIALS');
}
let DynamicCredentialsModule = class DynamicCredentialsModule {
    async init() {
        await import('./dynamic-credentials.controller.js');
        await import('./credential-resolvers/n8n-credential-resolver.js');
        if (isExternalResolversEnabled()) {
            await import('./credential-resolvers.controller.js');
            await import('./context-establishment-hooks/index.js');
            await import('./credential-resolvers/oauth-credential-resolver.js');
            await import('./credential-resolvers/slack-credential-resolver.js');
        }
        const { DynamicCredentialResolverRegistry, DynamicCredentialStorageService, DynamicCredentialService, N8nResolverSeeder, CredentialConnectionStatusService, } = await import('./services/index.js');
        await import('./workflow-status.controller.js');
        await di_1.Container.get(DynamicCredentialResolverRegistry).init();
        await di_1.Container.get(N8nResolverSeeder).seed();
        const { DynamicCredentialsProxy } = await import('../../credentials/dynamic-credentials-proxy.js');
        const credentialsProxy = di_1.Container.get(DynamicCredentialsProxy);
        const dynamicCredentialService = di_1.Container.get(DynamicCredentialService);
        const dynamicCredentialStorageService = di_1.Container.get(DynamicCredentialStorageService);
        credentialsProxy.setResolverProvider(dynamicCredentialService);
        credentialsProxy.setStorageProvider(dynamicCredentialStorageService);
        const { CredentialConnectionStatusProxy } = await import('../../credentials/credential-connection-status-proxy.js');
        di_1.Container.get(CredentialConnectionStatusProxy).setProvider(di_1.Container.get(CredentialConnectionStatusService));
        const { ExecutingUserIdentifierProxy } = await import('@n8n/backend-services');
        const { N8NIdentifier } = await import('./credential-resolvers/identifiers/n8n-identifier.js');
        di_1.Container.get(ExecutingUserIdentifierProxy).setProvider(di_1.Container.get(N8NIdentifier));
    }
    async entities() {
        const { DynamicCredentialResolver } = await import('./database/entities/credential-resolver.js');
        const { DynamicCredentialEntry } = await import('./database/entities/dynamic-credential-entry.js');
        const { DynamicCredentialUserEntry } = await import('./database/entities/dynamic-credential-user-entry.js');
        return [DynamicCredentialResolver, DynamicCredentialEntry, DynamicCredentialUserEntry];
    }
    async context() {
        const { CredentialCheckProxyService } = await import('./services/credential-check-proxy.service.js');
        return { credentialCheckProxy: di_1.Container.get(CredentialCheckProxyService) };
    }
    async shutdown() { }
};
exports.DynamicCredentialsModule = DynamicCredentialsModule;
__decorate([
    (0, decorators_1.OnShutdown)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DynamicCredentialsModule.prototype, "shutdown", null);
exports.DynamicCredentialsModule = DynamicCredentialsModule = __decorate([
    (0, decorators_1.BackendModule)({ name: 'dynamic-credentials', licenseFlag: constants_1.LICENSE_FEATURES.DYNAMIC_CREDENTIALS })
], DynamicCredentialsModule);
//# sourceMappingURL=dynamic-credentials.module.js.map