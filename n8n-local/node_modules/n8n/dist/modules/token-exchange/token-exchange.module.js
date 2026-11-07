"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenExchangeModule = void 0;
const backend_common_1 = require("@n8n/backend-common");
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
let TokenExchangeModule = class TokenExchangeModule {
    async entities() {
        const { TokenExchangeJti } = await import('./database/entities/token-exchange-jti.entity.js');
        const { TrustedKeySourceEntity } = await import('./database/entities/trusted-key-source.entity.js');
        const { TrustedKeyEntity } = await import('./database/entities/trusted-key.entity.js');
        return [TokenExchangeJti, TrustedKeySourceEntity, TrustedKeyEntity];
    }
    async init() {
        if (!(0, backend_common_1.isEnvFeatureEnabled)('N8N_ENV_FEAT_TOKEN_EXCHANGE')) {
            return;
        }
        const { TrustedKeyService } = await import('./services/trusted-key.service.js');
        await di_1.Container.get(TrustedKeyService).initialize();
        await import('./controllers/token-exchange.controller.js');
        await import('./controllers/embed-auth.controller.js');
        const { ScopedJwtStrategy } = await import('./services/scoped-jwt.strategy.js');
        const { AuthStrategyRegistry } = await import('@n8n/backend-services/auth');
        di_1.Container.get(AuthStrategyRegistry).register(di_1.Container.get(ScopedJwtStrategy));
    }
    async systemTasks() {
        if (!(0, backend_common_1.isEnvFeatureEnabled)('N8N_ENV_FEAT_TOKEN_EXCHANGE')) {
            return [];
        }
        const { TrustedKeyRefreshTask } = await import('./services/trusted-key-refresh.task.js');
        const { JtiCleanupTask } = await import('./services/jti-cleanup.task.js');
        return [TrustedKeyRefreshTask, JtiCleanupTask];
    }
};
exports.TokenExchangeModule = TokenExchangeModule;
exports.TokenExchangeModule = TokenExchangeModule = __decorate([
    (0, decorators_1.BackendModule)({
        name: 'token-exchange',
        licenseFlag: constants_1.LICENSE_FEATURES.TOKEN_EXCHANGE,
        instanceTypes: ['main'],
    })
], TokenExchangeModule);
//# sourceMappingURL=token-exchange.module.js.map