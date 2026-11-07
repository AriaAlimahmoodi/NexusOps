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
exports.EngineV2Module = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const node_crypto_1 = require("node:crypto");
let EngineV2Module = class EngineV2Module {
    async init() {
        if (di_1.Container.get(config_1.ExecutionsConfig).mode === 'queue') {
            throw new n8n_workflow_1.UserError('The engine-v2 module does not support queue mode.');
        }
        const engineConfig = di_1.Container.get(config_1.EngineConfig);
        if (engineConfig.mode === 'remote') {
            assertRemoteConfig(engineConfig);
        }
        else if (!engineConfig.authSecret) {
            engineConfig.authSecret = (0, node_crypto_1.randomBytes)(32).toString('hex');
        }
        const { EngineControlPlaneServer } = await import('./engine-control-plane-server.js');
        await di_1.Container.get(EngineControlPlaneServer).start();
        const logger = di_1.Container.get(backend_common_1.Logger).scoped('engine-v2');
        const { EngineV2WebhookResponseRegistry } = await import('./webhook-response/webhook-response-registry.service.js');
        if (engineConfig.mode === 'in-process') {
            const { responseSender, responseReceiver } = await this.initInMemoryResponseChannel(logger);
            di_1.Container.get(EngineV2WebhookResponseRegistry).useReceiver(responseReceiver);
            this.responseSender = responseSender;
            this.responseReceiver = responseReceiver;
            const { EngineV2Runtime } = await import('./engine-v2.runtime.js');
            await di_1.Container.get(EngineV2Runtime).init(responseSender);
        }
        else {
            const { startRedisExecutionResponseReceiver } = await import('./response-channel/redis-execution-response-channel.js');
            const responseReceiver = await startRedisExecutionResponseReceiver(logger);
            di_1.Container.get(EngineV2WebhookResponseRegistry).useReceiver(responseReceiver);
            this.responseReceiver = responseReceiver;
        }
        const { EngineDataPlaneClient } = await import('./engine-data-plane-client.js');
        const { EngineDataPlaneProxyService } = await import('../../services/engine-data-plane-proxy.service.js');
        di_1.Container.get(EngineDataPlaneProxyService).registerProvider(di_1.Container.get(EngineDataPlaneClient));
    }
    async initInMemoryResponseChannel(logger) {
        const { InMemoryExecutionResponseChannel } = await import('./response-channel/in-memory-execution-response-channel.js');
        const { InMemoryExecutionResponseSender } = await import('./response-channel/in-memory-execution-response-sender.js');
        const { InMemoryExecutionResponseReceiver } = await import('./response-channel/in-memory-execution-response-receiver.js');
        const responseChannel = new InMemoryExecutionResponseChannel();
        return {
            responseSender: new InMemoryExecutionResponseSender(responseChannel, logger),
            responseReceiver: new InMemoryExecutionResponseReceiver(responseChannel, logger),
        };
    }
    async shutdown() {
        try {
            if (di_1.Container.get(config_1.EngineConfig).mode === 'in-process') {
                const { EngineV2Runtime } = await import('./engine-v2.runtime.js');
                await di_1.Container.get(EngineV2Runtime).shutdown();
            }
        }
        finally {
            await Promise.all([this.responseSender?.stop(), this.responseReceiver?.stop()]);
        }
        const { EngineControlPlaneServer } = await import('./engine-control-plane-server.js');
        await di_1.Container.get(EngineControlPlaneServer).stop();
    }
};
exports.EngineV2Module = EngineV2Module;
__decorate([
    (0, decorators_1.OnShutdown)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EngineV2Module.prototype, "shutdown", null);
exports.EngineV2Module = EngineV2Module = __decorate([
    (0, decorators_1.BackendModule)({ name: 'engine-v2', instanceTypes: ['main'] })
], EngineV2Module);
function assertRemoteConfig(config) {
    if (!config.authSecret) {
        throw new n8n_workflow_1.UserError('N8N_ENGINE_MODE=remote needs N8N_ENGINE_AUTH_SECRET. The data plane runs elsewhere, so this main cannot generate the shared secret.');
    }
    if (!config.baseUrl) {
        throw new n8n_workflow_1.UserError('N8N_ENGINE_MODE=remote needs N8N_ENGINE_BASE_URL. The default points at this process, which does not run the data plane.');
    }
}
//# sourceMappingURL=engine-v2.module.js.map