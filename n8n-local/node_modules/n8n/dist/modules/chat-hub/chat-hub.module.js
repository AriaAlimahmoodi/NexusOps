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
exports.ChatHubModule = void 0;
const config_1 = require("@n8n/config");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
let ChatHubModule = class ChatHubModule {
    async init() {
        await import('./chat-hub.controller.js');
        await import('./chat-hub.settings.controller.js');
        const { ChatHubEventRelay } = await import('./chat-hub-event-relay.service.js');
        di_1.Container.get(ChatHubEventRelay);
        const isQueueMode = di_1.Container.get(config_1.ExecutionsConfig).mode === 'queue';
        const isWorker = di_1.Container.get(n8n_core_1.InstanceSettings).isWorker;
        if (!isQueueMode || isWorker) {
            await import('./chat-hub-execution-watcher.service.js');
        }
    }
    async settings() {
        const { ChatHubSettingsService } = await import('./chat-hub.settings.service.js');
        const service = di_1.Container.get(ChatHubSettingsService);
        const [enabled, providers, semanticSearch] = await Promise.all([
            service.getEnabled(),
            service.getAllProviderSettings(),
            service.getSemanticSearchSettings(),
        ]);
        return {
            enabled,
            providers,
            semanticSearch,
            agentUploadMaxSizeMb: di_1.Container.get(config_1.GlobalConfig).endpoints.formDataFileSizeMax,
        };
    }
    async entities() {
        const { ChatHubSession } = await import('./chat-hub-session.entity.js');
        const { ChatHubMessage } = await import('./chat-hub-message.entity.js');
        const { ChatHubAgent } = await import('./chat-hub-agent.entity.js');
        const { ChatHubTool } = await import('./chat-hub-tool.entity.js');
        return [ChatHubSession, ChatHubMessage, ChatHubAgent, ChatHubTool];
    }
    async shutdown() { }
};
exports.ChatHubModule = ChatHubModule;
__decorate([
    (0, decorators_1.OnShutdown)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ChatHubModule.prototype, "shutdown", null);
exports.ChatHubModule = ChatHubModule = __decorate([
    (0, decorators_1.BackendModule)({ name: 'chat-hub' })
], ChatHubModule);
//# sourceMappingURL=chat-hub.module.js.map