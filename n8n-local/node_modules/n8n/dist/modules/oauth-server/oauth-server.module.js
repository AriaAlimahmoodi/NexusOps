"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthServerModule = void 0;
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
let OAuthServerModule = class OAuthServerModule {
    async init() {
        const { instanceType } = di_1.Container.get(n8n_core_1.InstanceSettings);
        const { OAuthGrantRepository } = await import('./database/repositories/oauth-grant.repository.js');
        const { UserDeactivationHooks } = await import('../../services/user-deactivation-hooks.service.js');
        const grants = di_1.Container.get(OAuthGrantRepository);
        di_1.Container.get(UserDeactivationHooks).register('oauth-server', async (userId, ctx) => {
            await grants.deleteUserGrants(userId, ctx);
        });
        if (instanceType === 'main') {
            await grants.deleteGrantsForDisabledUsers().catch((error) => {
                di_1.Container.get(backend_common_1.Logger).error('Failed to clean up OAuth grants for disabled users', {
                    error,
                });
            });
            await import('./oauth.controller.js');
            await import('./oauth-consent.controller.js');
            await import('./oauth-clients.controller.js');
        }
        if (instanceType === 'main' || instanceType === 'webhook') {
            const { OAuthSigningKeyService } = await import('./oauth-signing-key.service.js');
            await di_1.Container.get(OAuthSigningKeyService).initialize();
        }
        if (instanceType === 'main') {
            const { JwksRegistry } = await import('@n8n/backend-services/auth');
            const { OAuthSigningJwksProvider } = await import('./oauth-signing-jwks.provider.js');
            di_1.Container.get(JwksRegistry).register(di_1.Container.get(OAuthSigningJwksProvider));
        }
        const { OAuthTokenVerifierProxy } = await import('@n8n/backend-services/auth');
        const { OAuthTokenService } = await import('./oauth-token.service.js');
        di_1.Container.get(OAuthTokenVerifierProxy).registerProvider(di_1.Container.get(OAuthTokenService));
        const { registerProtectedResourceResolvers } = await import('./protected-resource-resolvers/index.js');
        registerProtectedResourceResolvers();
        const { OAuth2FlowProxy } = await import('@n8n/backend-services/auth');
        const { OAuth2FlowService } = await import('./oauth-flow.service.js');
        di_1.Container.get(OAuth2FlowProxy).registerProvider(di_1.Container.get(OAuth2FlowService));
        const { LocalAuthorizationServerProxy } = await import('../../modules/inbound-auth-core/local-authorization-server.proxy.js');
        const { OAuthServerLocalAuthorizationServer } = await import('./oauth-local-authorization-server.js');
        await di_1.Container.get(LocalAuthorizationServerProxy).registerProvider(di_1.Container.get(OAuthServerLocalAuthorizationServer));
    }
    async entities() {
        const { OAuthClient } = await import('./database/entities/oauth-client.entity.js');
        const { AuthorizationCode } = await import('./database/entities/oauth-authorization-code.entity.js');
        const { AccessToken } = await import('./database/entities/oauth-access-token.entity.js');
        const { RefreshToken } = await import('./database/entities/oauth-refresh-token.entity.js');
        const { UserConsent } = await import('./database/entities/oauth-user-consent.entity.js');
        return [OAuthClient, AuthorizationCode, AccessToken, RefreshToken, UserConsent];
    }
};
exports.OAuthServerModule = OAuthServerModule;
exports.OAuthServerModule = OAuthServerModule = __decorate([
    (0, decorators_1.BackendModule)({ name: 'oauth-server', instanceTypes: ['main', 'webhook', 'worker'] })
], OAuthServerModule);
//# sourceMappingURL=oauth-server.module.js.map