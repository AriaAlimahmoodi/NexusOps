"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuntimeCredentialsModule = void 0;
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const backend_services_1 = require("@n8n/backend-services");
let RuntimeCredentialsModule = class RuntimeCredentialsModule {
    async init() {
        if (!(0, backend_common_1.isEnvFeatureEnabled)('N8N_ENV_FEAT_RUNTIME_CREDENTIALS'))
            return;
        const { RuntimeCredentialsService } = await import('./runtime-credentials.service.js');
        di_1.Container.get(RuntimeCredentialsService).init();
        await import('./runtime-credentials-context-hook.js');
        await import('./runtime-credentials.config.js');
        const { RuntimeCredentialsAccessService } = await import('./runtime-credentials-access.service.js');
        di_1.Container.get(backend_services_1.RuntimeCredentialProxyService).registerProvider(di_1.Container.get(RuntimeCredentialsAccessService));
    }
};
exports.RuntimeCredentialsModule = RuntimeCredentialsModule;
exports.RuntimeCredentialsModule = RuntimeCredentialsModule = __decorate([
    (0, decorators_1.BackendModule)({ name: 'runtime-credentials' })
], RuntimeCredentialsModule);
//# sourceMappingURL=runtime-credentials.module.js.map