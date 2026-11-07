"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InboundAuthCoreModule = void 0;
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const inbound_auth_1 = require("@n8n/inbound-auth");
const n8n_core_1 = require("n8n-core");
const auth_1 = require("@n8n/backend-services/auth");
let InboundAuthCoreModule = class InboundAuthCoreModule {
    async init() {
        const { LocalAuthorizationServerProxy } = await import('./local-authorization-server.proxy.js');
        const localServer = di_1.Container.get(LocalAuthorizationServerProxy);
        if (!di_1.Container.has(inbound_auth_1.LocalAuthorizationServer)) {
            di_1.Container.set(inbound_auth_1.LocalAuthorizationServer, localServer);
        }
        const { TrustedSourceDbStore } = await import('./trusted-source.store.js');
        if (!di_1.Container.has(inbound_auth_1.TrustedSourceStore)) {
            di_1.Container.set(inbound_auth_1.TrustedSourceStore, di_1.Container.get(TrustedSourceDbStore));
        }
        const { TrustedSourceDbGate } = await import('./trusted-source.gate.js');
        if (!di_1.Container.has(inbound_auth_1.TrustedSourceGate)) {
            di_1.Container.set(inbound_auth_1.TrustedSourceGate, di_1.Container.get(TrustedSourceDbGate));
        }
        if (di_1.Container.get(n8n_core_1.InstanceSettings).instanceType === 'main') {
            const { SystemTrustedSourceSeeder } = await import('./system-trusted-source.seeder.js');
            await di_1.Container.get(SystemTrustedSourceSeeder).seed();
            const { SYSTEM_TRUSTED_SOURCE_ID } = await import('./constants.js');
            await localServer.onProviderRegistered(async () => {
                try {
                    const { TrustedSourceDiscoveryService } = await import('./trusted-source-discovery.service.js');
                    await di_1.Container.get(TrustedSourceDiscoveryService).refresh(SYSTEM_TRUSTED_SOURCE_ID);
                }
                catch (error) {
                    di_1.Container.get(backend_common_1.Logger).warn('Could not discover the system trusted source at boot', {
                        error,
                    });
                }
            });
            if ((0, backend_common_1.isEnvFeatureEnabled)('N8N_ENV_FEAT_TRUSTED_SOURCES_API_ENABLED')) {
                await import('./trusted-source.controller.js');
            }
        }
        const { OAuth2AuthenticationService } = await import('./authentication.service.js');
        di_1.Container.set(inbound_auth_1.AuthenticationService, di_1.Container.get(OAuth2AuthenticationService));
        const { TrustedSourceIdentityService } = await import('./identity/trusted-source-identity.service.js');
        if (!di_1.Container.has(inbound_auth_1.IdentityService)) {
            di_1.Container.set(inbound_auth_1.IdentityService, di_1.Container.get(TrustedSourceIdentityService));
        }
        const { InboundAuthPipeline } = await import('./authentication-pipeline.js');
        di_1.Container.set(inbound_auth_1.AuthenticationPipeline, di_1.Container.get(InboundAuthPipeline));
        const { InboundResourceAdmission } = await import('./resource-admission.js');
        di_1.Container.set(inbound_auth_1.ResourceAdmission, di_1.Container.get(InboundResourceAdmission));
        if (di_1.Container.get(n8n_core_1.InstanceSettings).instanceType === 'main') {
            const { PublicApiProtectedResource } = await import('./public-api-protected-resource.js');
            const { PublicApiOAuthStrategy } = await import('./public-api-oauth.strategy.js');
            di_1.Container.get(auth_1.ProtectedResourceRegistry).register(di_1.Container.get(PublicApiProtectedResource));
            di_1.Container.get(auth_1.AuthStrategyRegistry).register(di_1.Container.get(PublicApiOAuthStrategy));
        }
    }
    async context() {
        const { TrustedSourceDbDirectory } = await import('./trusted-source-directory.service.js');
        return { trustedSourceDirectory: di_1.Container.get(TrustedSourceDbDirectory) };
    }
    async systemTasks() {
        const { TrustedSourceDiscoveryTask } = await import('./trusted-source-discovery.task.js');
        return [TrustedSourceDiscoveryTask];
    }
    async entities() {
        const { TrustedSourceEntity } = await import('./database/entities/trusted-source.entity.js');
        const { TrustedSourceIdentityEntity } = await import('./database/entities/trusted-source-identity.entity.js');
        return [TrustedSourceEntity, TrustedSourceIdentityEntity];
    }
};
exports.InboundAuthCoreModule = InboundAuthCoreModule;
exports.InboundAuthCoreModule = InboundAuthCoreModule = __decorate([
    (0, decorators_1.BackendModule)({ name: 'inbound-auth-core', instanceTypes: ['main', 'webhook', 'worker'] })
], InboundAuthCoreModule);
//# sourceMappingURL=inbound-auth-core.module.js.map