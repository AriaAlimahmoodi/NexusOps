"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentsModule = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
let AgentsModule = class AgentsModule {
    async init() {
        const { SandboxSettingsService } = await import('../../services/sandbox-settings.service.js');
        di_1.Container.get(SandboxSettingsService).registerCredentialUses();
        const { SkillsHubRollout } = await import('./skills/skills-hub-rollout.js');
        di_1.Container.get(SkillsHubRollout).init();
        const { SkillsHubStartupCopy } = await import('./skills/skills-hub-startup-copy.js');
        await di_1.Container.get(SkillsHubStartupCopy).runOnStartup();
        await import('./agent-workflow-tool-resume.service.js');
        await import('./agents-catalog.controller.js');
        await import('./agent-threads.controller.js');
        await import('./agents.controller.js');
        await import('./agents-settings.controller.js');
        await import('./agents-config.controller.js');
        await import('./agents-skills.controller.js');
        await import('./skills.controller.js');
        await import('./agent-knowledge.controller.js');
        await import('./agent-publish.controller.js');
        await import('./agent-chat.controller.js');
        await import('./agent-integrations.controller.js');
        await import('./agent-slack-integrations.controller.js');
        await import('./agent-teams-integrations.controller.js');
        await import('./agent-whatsapp-integrations.controller.js');
        await import('./agent-vector-stores.controller.js');
        await import('./agent-tasks.controller.js');
        await import('./agent-sandbox.controller.js');
        await import('./agents-list.controller.js');
        await import('./agent-mcp-access.controller.js');
        const { AgentsService } = await import('./agents.service.js');
        di_1.Container.get(AgentsService);
        const { AgentDependencyIndexListener } = await import('./agent-dependency-index.listener.js');
        di_1.Container.get(AgentDependencyIndexListener).init();
        const { AgentExecutionService } = await import('./agent-execution.service.js');
        di_1.Container.get(AgentExecutionService);
        const { AgentExecutionLogStore } = await import('./execution-log/agent-execution-log-store.js');
        const { AgentKnowledgeFileStore } = await import('./agent-knowledge-file-store.js');
        const { ExecutionDataJsonStore } = await import('../../executions/execution-data/execution-data-json-store.js');
        const { registerAgentBlobByteStores } = await import('./register-blob-byte-stores.js');
        await registerAgentBlobByteStores({
            executionDataJsonStore: di_1.Container.get(ExecutionDataJsonStore),
            agentExecutionLogStore: di_1.Container.get(AgentExecutionLogStore),
            agentKnowledgeFileStore: di_1.Container.get(AgentKnowledgeFileStore),
        });
        const { registerFavoriteResolver } = await import('./register-favorite-resolver.js');
        registerFavoriteResolver();
        const { registerAgentUsageProvider } = await import('./register-agent-usage-provider.js');
        registerAgentUsageProvider();
        const { AgentRuntimeCacheService } = await import('./agent-runtime-cache.service.js');
        di_1.Container.get(AgentRuntimeCacheService);
        const { AgentHistoryRepository } = await import('./repositories/agent-history.repository.js');
        di_1.Container.get(AgentHistoryRepository);
        const { AgentBudgetSpendRepository } = await import('./repositories/agent-budget-spend.repository.js');
        di_1.Container.get(AgentBudgetSpendRepository);
        const { AgentSecureRuntime } = await import('./runtime/agent-secure-runtime.js');
        di_1.Container.get(AgentSecureRuntime);
        const { ChatIntegrationRegistry } = await import('./integrations/agent-chat-integration.js');
        const { SlackIntegration } = await import('./integrations/platforms/slack/slack-integration.js');
        const { TelegramIntegration } = await import('./integrations/platforms/telegram-integration.js');
        const { LinearIntegration } = await import('./integrations/platforms/linear-integration.js');
        const { DiscordIntegration } = await import('./integrations/platforms/discord-integration.js');
        const { WhatsAppIntegration } = await import('./integrations/platforms/whatsapp/whatsapp-integration.js');
        const { TeamsIntegration } = await import('./integrations/platforms/teams/teams-integration.js');
        const { N8nChatIntegration } = await import('./integrations/platforms/n8n-chat-integration.js');
        const registry = di_1.Container.get(ChatIntegrationRegistry);
        registry.register(di_1.Container.get(SlackIntegration));
        registry.register(di_1.Container.get(TelegramIntegration));
        registry.register(di_1.Container.get(LinearIntegration));
        registry.register(di_1.Container.get(DiscordIntegration));
        registry.register(di_1.Container.get(WhatsAppIntegration));
        registry.register(di_1.Container.get(TeamsIntegration));
        registry.register(di_1.Container.get(N8nChatIntegration));
        const { AgentChannelReconciler } = await import('./integrations/agent-channel-reconciler.service.js');
        const { AgentTaskService } = await import('./agent-task.service.js');
        const channelReconciler = di_1.Container.get(AgentChannelReconciler);
        const taskService = di_1.Container.get(AgentTaskService);
        const logger = di_1.Container.get(backend_common_1.Logger);
        const instanceSettings = di_1.Container.get(n8n_core_1.InstanceSettings);
        if (instanceSettings.instanceType === 'main') {
            const { AgentMessageQueueConsumer } = await import('./agent-message-queue-consumer.service.js');
            di_1.Container.get(AgentMessageQueueConsumer).start();
            await import('./background/agent-background-job.service.js');
            await import('./background/agent-wake.service.js');
            const { AgentInterruptedExecutionSweeper } = await import('./agent-interrupted-execution-sweeper.js');
            void di_1.Container.get(AgentInterruptedExecutionSweeper)
                .sweep()
                .catch((error) => {
                logger.error('[Agents] Interrupted execution sweep failed', { error });
            });
        }
        if (instanceSettings.instanceType !== 'worker') {
            channelReconciler.init();
        }
        if (instanceSettings.isLeader) {
            void taskService.reconnectAll().catch((error) => {
                logger.error('[Agents] Failed to reconnect tasks on startup', {
                    error: error instanceof Error ? error.message : String(error),
                });
            });
        }
        else {
            logger.debug('[Agents] Skipping task reconnect on startup — not leader');
        }
        if (instanceSettings.instanceType === 'main') {
            const { AgentTaskJobRegistrar } = await import('./scheduling/agent-task-job-registrar.js');
            const registrar = di_1.Container.get(AgentTaskJobRegistrar);
            if (registrar.isEnabled()) {
                const { AgentTaskTaskHandler } = await import('./scheduling/agent-task-task-handler.js');
                const { DurableScheduler } = await import('../../scheduling/durable-scheduler.js');
                const agentTaskHandler = di_1.Container.get(AgentTaskTaskHandler);
                di_1.Container.get(DurableScheduler).registerTaskHandler(agentTaskHandler.taskType, agentTaskHandler);
            }
            try {
                await registrar.reconcileAll();
            }
            catch (error) {
                logger.error('[Agents] Failed to reconcile durable agent-task jobs on startup', {
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }
    }
    async systemTasks() {
        const { AgentCheckpointPruningTask } = await import('./agent-checkpoint-pruning.task.js');
        const { AgentInterruptedExecutionSweepTask } = await import('./agent-interrupted-execution-sweep.task.js');
        const { AgentChannelMediaRetentionTask } = await import('./agent-channel-media-retention.task.js');
        return [
            AgentCheckpointPruningTask,
            AgentInterruptedExecutionSweepTask,
            AgentChannelMediaRetentionTask,
        ];
    }
    async settings() {
        const config = di_1.Container.get(config_1.AgentsConfig);
        const { AgentsSettingsService } = await import('./agents-settings.service.js');
        const { AiService } = await import('../../services/ai.service.js');
        const { SandboxSettingsService } = await import('../../services/sandbox-settings.service.js');
        const { SkillsHubRollout } = await import('./skills/skills-hub-rollout.js');
        const aiService = di_1.Container.get(AiService);
        const proxyEnabled = aiService.isProxyEnabled();
        return {
            enabled: await di_1.Container.get(AgentsSettingsService).getEnabled(),
            modules: [...config.modules],
            knowledgeBaseEnabled: di_1.Container.get(SandboxSettingsService).isAgentSandboxEnabled(),
            proxyEnabled,
            skillsHubEnabled: di_1.Container.get(SkillsHubRollout).isEnabled,
        };
    }
    async entities() {
        const { Agent } = await import('./entities/agent.entity.js');
        const { AgentFile } = await import('./entities/agent-file.entity.js');
        const { AgentChatAttachment } = await import('./entities/agent-chat-attachment.entity.js');
        const { AgentChatSubscription } = await import('./entities/agent-chat-subscription.entity.js');
        const { AgentChannelStatus } = await import('./entities/agent-channel-status.entity.js');
        const { AgentCheckpoint } = await import('./entities/agent-checkpoint.entity.js');
        const { AgentResourceEntity } = await import('./entities/agent-resource.entity.js');
        const { AgentThreadEntity } = await import('./entities/agent-thread.entity.js');
        const { AgentMessageEntity } = await import('./entities/agent-message.entity.js');
        const { AgentExecutionMessageLink } = await import('./entities/agent-execution-message-link.entity.js');
        const { AgentExecutionThread } = await import('./entities/agent-execution-thread.entity.js');
        const { AgentThreadGrant } = await import('./entities/agent-thread-grant.entity.js');
        const { AgentExecution } = await import('./entities/agent-execution.entity.js');
        const { AgentMessageQueue } = await import('./entities/agent-message-queue.entity.js');
        const { AgentBackgroundJob } = await import('./entities/agent-background-job.entity.js');
        const { AgentPlan } = await import('./entities/agent-plan.entity.js');
        const { AgentPlanHistory } = await import('./entities/agent-plan-history.entity.js');
        const { AgentHistory } = await import('./entities/agent-history.entity.js');
        const { AgentCredentialDependency } = await import('./entities/agent-credential-dependency.entity.js');
        const { AgentWorkflowDependency } = await import('./entities/agent-workflow-dependency.entity.js');
        const { AgentTask } = await import('./entities/agent-task.entity.js');
        const { AgentTaskRunLock } = await import('./entities/agent-task-run-lock.entity.js');
        const { AgentBudgetSpend } = await import('./entities/agent-budget-spend.entity.js');
        const { AgentBudgetAppliedCall } = await import('./entities/agent-budget-applied-call.entity.js');
        const { AgentTaskSnapshot } = await import('./entities/agent-task-snapshot.entity.js');
        const { AgentObservationEntity } = await import('./entities/agent-observation.entity.js');
        const { AgentObservationCursorEntity } = await import('./entities/agent-observation-cursor.entity.js');
        const { AgentObservationLockEntity } = await import('./entities/agent-observation-lock.entity.js');
        const { AgentMemoryEntryEntity } = await import('./entities/agent-memory-entry.entity.js');
        const { AgentMemoryEntryCandidateEntity } = await import('./entities/agent-memory-entry-candidate.entity.js');
        const { AgentMemoryEntryLockEntity } = await import('./entities/agent-memory-entry-lock.entity.js');
        const { AgentMemoryEntrySourceEntity } = await import('./entities/agent-memory-entry-source.entity.js');
        const { Skill } = await import('./entities/skill.entity.js');
        const { SkillVersion } = await import('./entities/skill-version.entity.js');
        const { SkillFile } = await import('./entities/skill-file.entity.js');
        const { AgentSkillDependency } = await import('./entities/agent-skill-dependency.entity.js');
        const { AgentVersionSkillDependency } = await import('./entities/agent-version-skill-dependency.entity.js');
        return [
            Agent,
            AgentFile,
            AgentChatAttachment,
            AgentChatSubscription,
            AgentChannelStatus,
            AgentCheckpoint,
            AgentResourceEntity,
            AgentThreadEntity,
            AgentMessageEntity,
            AgentExecutionMessageLink,
            AgentExecutionThread,
            AgentThreadGrant,
            AgentExecution,
            AgentMessageQueue,
            AgentBackgroundJob,
            AgentPlan,
            AgentPlanHistory,
            AgentHistory,
            AgentCredentialDependency,
            AgentWorkflowDependency,
            AgentTask,
            AgentTaskRunLock,
            AgentBudgetSpend,
            AgentBudgetAppliedCall,
            AgentTaskSnapshot,
            AgentObservationEntity,
            AgentObservationCursorEntity,
            AgentObservationLockEntity,
            AgentMemoryEntryEntity,
            AgentMemoryEntryCandidateEntity,
            AgentMemoryEntryLockEntity,
            AgentMemoryEntrySourceEntity,
            Skill,
            SkillVersion,
            SkillFile,
            AgentSkillDependency,
            AgentVersionSkillDependency,
        ];
    }
    async context() {
        const { AgentsService } = await import('./agents.service.js');
        return { agentsService: di_1.Container.get(AgentsService) };
    }
};
exports.AgentsModule = AgentsModule;
exports.AgentsModule = AgentsModule = __decorate([
    (0, decorators_1.BackendModule)({ name: 'agents' })
], AgentsModule);
//# sourceMappingURL=agents.module.js.map