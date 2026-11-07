"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthJweModule = void 0;
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const auth_1 = require("@n8n/backend-services/auth");
let OAuthJweModule = class OAuthJweModule {
    async init() {
        const { OAuthJweDecryptService } = await import('./oauth-jwe-decrypt.service.js');
        di_1.Container.get(auth_1.OAuthJweServiceProxy).setHandler(di_1.Container.get(OAuthJweDecryptService));
        if (di_1.Container.get(n8n_core_1.InstanceSettings).instanceType === 'main') {
            const { OAuthJweKeyService } = await import('./oauth-jwe-key.service.js');
            await di_1.Container.get(OAuthJweKeyService).initialize();
            const { OAuthJweJwksProvider } = await import('./oauth-jwe-jwks.provider.js');
            di_1.Container.get(auth_1.JwksRegistry).register(di_1.Container.get(OAuthJweJwksProvider));
        }
    }
    async context() {
        return { oauthJweProxyProvider: di_1.Container.get(auth_1.OAuthJweServiceProxy) };
    }
};
exports.OAuthJweModule = OAuthJweModule;
exports.OAuthJweModule = OAuthJweModule = __decorate([
    (0, decorators_1.BackendModule)({ name: 'oauth-jwe' })
], OAuthJweModule);
//# sourceMappingURL=oauth-jwe.module.js.map