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
exports.InstanceAiModule = void 0;
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
let InstanceAiModule = class InstanceAiModule {
    async init() {
        const { InstanceCredentialBroker } = await import('../../credentials/instance-credential-broker.js');
        const { InstanceAiSettingsService, INSTANCE_AI_MODEL_CREDENTIAL_POLICY, INSTANCE_AI_SEARCH_CREDENTIAL_POLICY, } = await import('./instance-ai-settings.service.js');
        const { SandboxSettingsService } = await import('../../services/sandbox-settings.service.js');
        const settingsService = di_1.Container.get(InstanceAiSettingsService);
        const credentialBroker = di_1.Container.get(InstanceCredentialBroker);
        credentialBroker.registerUse(INSTANCE_AI_MODEL_CREDENTIAL_POLICY);
        di_1.Container.get(SandboxSettingsService).registerCredentialUses();
        credentialBroker.registerUse(INSTANCE_AI_SEARCH_CREDENTIAL_POLICY);
        await settingsService.loadFromDb();
        const { InstanceAiSetupTelemetryService } = await import('./instance-ai-setup-telemetry.service.js');
        await di_1.Container.get(InstanceAiSetupTelemetryService).recordSetupCompletedIfNeeded();
        await import('./instance-ai.controller.js');
        await import('./mcp/instance-ai-mcp-connection.controller.js');
        const { InstanceAiConfig } = await import('@n8n/config');
        if (di_1.Container.get(InstanceAiConfig).workflowSuggestionsEnabled) {
            await import('./self-healing/self-healing-results.controller.js');
            const { InboxSourceRegistry } = await import('../inbox/inbox-source.registry.js');
            const { SelfHealingResultService } = await import('./self-healing/self-healing-result.service.js');
            const results = di_1.Container.get(SelfHealingResultService);
            di_1.Container.get(InboxSourceRegistry).register({
                type: 'self_healing_result',
                isEnabled: async () => di_1.Container.get(InstanceAiConfig).workflowSuggestionsEnabled,
                list: async (user, query) => await results.listForInbox(user, query),
                count: async (user) => await results.countForInbox(user),
            });
            const { WorkflowSuggestionEventRelay } = await import('./workflow-suggestions/workflow-suggestion-event-relay.service.js');
            di_1.Container.get(WorkflowSuggestionEventRelay);
        }
        const { InstanceAiEventRelay } = await import('./instance-ai-event-relay.service.js');
        di_1.Container.get(InstanceAiEventRelay);
        const { InterruptedRunSweeper } = await import('./event-bus/interrupted-run-sweeper.js');
        const { InstanceAiService } = await import('./instance-ai.service.js');
        const sweepLogger = di_1.Container.get(backend_common_1.Logger).scoped('instance-ai');
        const sweeper = di_1.Container.get(InterruptedRunSweeper);
        sweeper.setResumeHost(di_1.Container.get(InstanceAiService));
        void sweeper.sweep().catch((error) => {
            sweepLogger.error('Interrupted-run sweep failed on startup', { error });
        });
        if (process.env.E2E_TESTS === 'true' && process.env.NODE_ENV !== 'production') {
            await import('./instance-ai-test.controller.js');
        }
    }
    async systemTasks() {
        const { InstanceAiConfig } = await import('@n8n/config');
        if (di_1.Container.get(InstanceAiConfig).pruneInterval <= 0)
            return [];
        const { InstanceAiCheckpointPruningTask } = await import('./instance-ai-checkpoint-pruning.task.js');
        return [InstanceAiCheckpointPruningTask];
    }
    async settings() {
        const { GlobalConfig } = await import('@n8n/config');
        const { InstanceAiService } = await import('./instance-ai.service.js');
        const { InstanceAiSettingsService } = await import('./instance-ai-settings.service.js');
        const globalConfig = di_1.Container.get(GlobalConfig);
        const service = di_1.Container.get(InstanceAiService);
        const settingsService = di_1.Container.get(InstanceAiSettingsService);
        const enabled = settingsService.isAgentEnabled();
        const mcpConnectionsAvailable = service.areMcpConnectionsAvailable();
        const localGatewayDisabled = settingsService.isLocalGatewayDisabled();
        const browserUseEnabled = settingsService.isBrowserUseEnabled();
        const sandboxStatus = settingsService.getSandboxStatus();
        const setupCompleted = await settingsService.isSetupCompleted();
        return {
            enabled,
            mcpConnectionsAvailable,
            localGatewayDisabled,
            browserUseEnabled,
            proxyEnabled: service.isProxyEnabled(),
            cloudManaged: globalConfig.deployment.type === 'cloud',
            setupCompleted,
            sandboxEnabled: sandboxStatus.enabled,
            workflowBuilderAvailable: enabled && sandboxStatus.workflowBuilderAvailable,
            sandboxUnavailableReason: sandboxStatus.unavailableReason,
            runDebugEnabled: globalConfig.instanceAi.runDebugEnabled,
        };
    }
    async entities() {
        const { InstanceAiThread } = await import('./entities/instance-ai-thread.entity.js');
        const { InstanceAiMessage } = await import('./entities/instance-ai-message.entity.js');
        const { InstanceAiResource } = await import('./entities/instance-ai-resource.entity.js');
        const { InstanceAiIterationLog } = await import('./entities/instance-ai-iteration-log.entity.js');
        const { InstanceAiCheckpoint } = await import('./entities/instance-ai-checkpoint.entity.js');
        const { InstanceAiPendingConfirmation } = await import('./entities/instance-ai-pending-confirmation.entity.js');
        const { InstanceAiObservation } = await import('./entities/instance-ai-observation.entity.js');
        const { InstanceAiObservationCursor } = await import('./entities/instance-ai-observation-cursor.entity.js');
        const { InstanceAiObservationLock } = await import('./entities/instance-ai-observation-lock.entity.js');
        const { InstanceAiMcpRegistryConnection } = await import('./entities/instance-ai-mcp-registry-connection.entity.js');
        const { InstanceAiThreadGrant } = await import('./entities/instance-ai-thread-grant.entity.js');
        const { InstanceAiThreadTabs } = await import('./entities/instance-ai-thread-tabs.entity.js');
        const { InstanceAiEventLogEntry } = await import('./entities/instance-ai-event-log-entry.entity.js');
        const { WorkflowSuggestion } = await import('./workflow-suggestions/database/workflow-suggestion.entity.js');
        const { WorkflowSuggestionActivity } = await import('./workflow-suggestions/database/workflow-suggestion-activity.entity.js');
        const { SelfHealingResult } = await import('./self-healing/database/self-healing-result.entity.js');
        return [
            InstanceAiThread,
            InstanceAiMessage,
            InstanceAiResource,
            InstanceAiIterationLog,
            InstanceAiCheckpoint,
            InstanceAiPendingConfirmation,
            InstanceAiObservation,
            InstanceAiObservationCursor,
            InstanceAiObservationLock,
            InstanceAiMcpRegistryConnection,
            InstanceAiThreadGrant,
            InstanceAiThreadTabs,
            InstanceAiEventLogEntry,
            WorkflowSuggestion,
            WorkflowSuggestionActivity,
            SelfHealingResult,
        ];
    }
    async shutdown() {
        const { InstanceAiService } = await import('./instance-ai.service.js');
        await di_1.Container.get(InstanceAiService).shutdown();
    }
};
exports.InstanceAiModule = InstanceAiModule;
__decorate([
    (0, decorators_1.OnShutdown)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InstanceAiModule.prototype, "shutdown", null);
exports.InstanceAiModule = InstanceAiModule = __decorate([
    (0, decorators_1.BackendModule)({ name: 'instance-ai', instanceTypes: ['main'] })
], InstanceAiModule);
//# sourceMappingURL=instance-ai.module.js.map