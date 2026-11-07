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
exports.AgentWorkflowToolResumeService = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const publisher_service_1 = require("../../scaling/pubsub/publisher.service");
const agent_execution_update_broadcaster_1 = require("./agent-execution-update-broadcaster");
const agent_execution_orchestrator_service_1 = require("./agent-execution-orchestrator.service");
const agent_repository_1 = require("./repositories/agent.repository");
const agent_memory_scope_1 = require("./utils/agent-memory-scope");
const agent_test_run_service_1 = require("./agent-test-run.service");
const agent_background_job_service_1 = require("./background/agent-background-job.service");
const chat_integration_service_1 = require("./integrations/chat-integration.service");
const integration_message_context_1 = require("./integrations/integration-message-context");
const integration_message_context_service_1 = require("./integrations/integration-message-context.service");
const n8n_checkpoint_storage_1 = require("./integrations/n8n-checkpoint-storage");
let AgentWorkflowToolResumeService = class AgentWorkflowToolResumeService {
    constructor(logger, userRepository, agentTestRunService, chatIntegrationService, messageContextService, executionUpdateBroadcaster, checkpointStorage, instanceSettings, publisher, backgroundJobService, agentExecutionOrchestratorService, agentRepository) {
        this.logger = logger;
        this.userRepository = userRepository;
        this.agentTestRunService = agentTestRunService;
        this.chatIntegrationService = chatIntegrationService;
        this.messageContextService = messageContextService;
        this.executionUpdateBroadcaster = executionUpdateBroadcaster;
        this.checkpointStorage = checkpointStorage;
        this.instanceSettings = instanceSettings;
        this.publisher = publisher;
        this.backgroundJobService = backgroundJobService;
        this.agentExecutionOrchestratorService = agentExecutionOrchestratorService;
        this.agentRepository = agentRepository;
        this.logger = this.logger.scoped('agents');
    }
    async handleWorkflowExecuteAfter(ctx) {
        const agentRun = ctx.runData.data.parentAgentRun;
        if (!agentRun)
            return;
        if (ctx.runData.status === 'waiting')
            return;
        await this.settleBackgroundJob(ctx);
        const checkpoint = await this.checkpointStorage.getStatus(agentRun.runId, agentRun.agentId);
        if (checkpoint.status !== 'active' || checkpoint.checkpoint?.status !== 'suspended')
            return;
        if (this.instanceSettings.isWorker) {
            await this.publisher.publishCommand({
                command: 'resume-agent-workflow-tool',
                payload: { agentRun, status: ctx.runData.status },
            });
            return;
        }
        await this.resumeSafely(agentRun, ctx.runData.status);
    }
    async handleResumeRelay({ agentRun, status, }) {
        await this.resumeSafely(agentRun, status);
    }
    async settleBackgroundJob(ctx) {
        const { status, data } = ctx.runData;
        if (!(0, n8n_workflow_1.isTerminalExecutionStatus)(status))
            return;
        if (status === 'success' && !ctx.runData.finished)
            return;
        try {
            const settlementStatus = (0, agent_background_job_service_1.settlementStatusForExecution)(status);
            const runData = data.resultData?.runData;
            await this.backgroundJobService.settleWorkflowJobByExecutionId(ctx.executionId, {
                status: settlementStatus,
                result: settlementStatus === 'completed' && runData
                    ? (0, agent_background_job_service_1.serializeWorkflowJobResult)((0, agent_background_job_service_1.collectResultData)(runData, false))
                    : null,
                error: data.resultData?.error?.message ?? null,
            }, runData);
        }
        catch (error) {
            this.logger.error('Failed to settle workflow background job', {
                executionId: ctx.executionId,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    async resumeSafely(agentRun, status) {
        try {
            await this.resume(agentRun, status);
        }
        catch (error) {
            this.logger.error('Failed to resume agent run after sub-workflow completed', {
                agentId: agentRun.agentId,
                runId: agentRun.runId,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    async resume(agentRun, status) {
        const resumeData = { type: 'workflow_finished', value: status };
        if (agentRun.publishedN8nChat === true) {
            await this.resumeInProductionChat(agentRun, resumeData);
            return;
        }
        if (agentRun.integrationType === api_types_1.N8N_CHAT_INTEGRATION_TYPE) {
            await this.resumeInPreviewChat(agentRun, resumeData);
            return;
        }
        if (!agentRun.integrationType) {
            this.logger.debug('Skipping agent resume for a run with no chat surface', {
                agentId: agentRun.agentId,
                runId: agentRun.runId,
            });
            return;
        }
        const checkpoint = await this.checkpointStorage.getStatus(agentRun.runId, agentRun.agentId);
        if (checkpoint.status !== 'active' || checkpoint.checkpoint.status !== 'suspended')
            return;
        const persistence = checkpoint.checkpoint.persistence;
        if (!persistence)
            return;
        const route = await this.getIntegrationResumeRoute(agentRun, agentRun.integrationType, persistence);
        if (!route)
            return;
        const { integrationType, credentialId, messageContext, allowLegacyThreadId } = route;
        const bridge = this.chatIntegrationService.getBridge(agentRun.agentId, integrationType, credentialId);
        if (!bridge) {
            this.logger.warn('No live chat bridge to resume the agent run into', {
                agentId: agentRun.agentId,
                integrationType,
                credentialId,
                runId: agentRun.runId,
            });
            return;
        }
        await bridge.resumeInAgentThread(agentRun.threadId, agentRun.runId, agentRun.toolCallId, resumeData, { messageContext, allowLegacyThreadId });
    }
    async resumeInProductionChat(agentRun, resumeData) {
        const user = agentRun.userId
            ? await this.userRepository.findOneBy({ id: agentRun.userId })
            : null;
        if (!user ||
            !(await this.agentRepository.isN8nChatPublished(agentRun.agentId, agentRun.projectId)))
            return;
        let executionId;
        const stream = this.agentExecutionOrchestratorService.resumeForChat({
            agentId: agentRun.agentId,
            projectId: agentRun.projectId,
            runId: agentRun.runId,
            toolCallId: agentRun.toolCallId,
            resumeData,
            user,
            usePublishedVersion: true,
            integrationType: api_types_1.N8N_CHAT_INTEGRATION_TYPE,
            chatSurface: 'n8n-chat',
            expectedMemory: {
                threadId: agentRun.threadId,
                resourceId: (0, agent_memory_scope_1.productionChatMemoryResourceId)(user.id),
            },
            onExecutionRecorded: (id) => {
                executionId = id;
            },
        });
        for await (const _chunk of stream) {
        }
        if (executionId)
            this.executionUpdateBroadcaster.notify({
                projectId: agentRun.projectId,
                agentId: agentRun.agentId,
                threadId: agentRun.threadId,
                executionId,
            });
    }
    async resumeInPreviewChat(agentRun, resumeData) {
        const user = agentRun.userId
            ? await this.userRepository.findByIdWithRole(agentRun.userId)
            : null;
        if (!user) {
            this.logger.warn('Cannot resume preview chat run without its user', {
                agentId: agentRun.agentId,
                runId: agentRun.runId,
                userId: agentRun.userId,
            });
            return;
        }
        const result = await this.agentTestRunService.resumeDraftRun({
            agentId: agentRun.agentId,
            projectId: agentRun.projectId,
            sessionId: agentRun.threadId,
            runId: agentRun.runId,
            toolCallId: agentRun.toolCallId,
            resumeData,
            user,
            chatSurface: agentRun.previewChat ? 'preview' : undefined,
            automaticPreviewContinuation: true,
            response: '',
        });
        if (result.status !== 'completed' && result.status !== 'suspended') {
            this.logger.warn('Preview chat run could not be resumed', {
                agentId: agentRun.agentId,
                runId: agentRun.runId,
                status: result.status,
            });
            return;
        }
        this.executionUpdateBroadcaster.notify({
            projectId: agentRun.projectId,
            agentId: agentRun.agentId,
            threadId: agentRun.threadId,
            executionId: result.executionId ?? '',
        });
    }
    async getIntegrationResumeRoute(agentRun, integrationType, persistence) {
        let messageContext = (0, integration_message_context_1.readIntegrationMessageContext)(persistence);
        const allowLegacyThreadId = messageContext === undefined;
        if (messageContext === undefined) {
            messageContext = await this.loadLegacyMessageContext(persistence.threadId, agentRun.runId);
        }
        const [platform, credentialId] = messageContext?.integrationConnectionId.split(':') ?? [];
        if (allowLegacyThreadId) {
            if (messageContext?.platform === integrationType && platform === integrationType) {
                return { integrationType, credentialId, messageContext, allowLegacyThreadId };
            }
            return {
                integrationType,
                credentialId: undefined,
                messageContext: null,
                allowLegacyThreadId,
            };
        }
        if (!messageContext || messageContext.platform !== platform || !credentialId) {
            this.logger.warn('Agent resume has no integration reply context', {
                agentId: agentRun.agentId,
                runId: agentRun.runId,
            });
            return undefined;
        }
        return {
            integrationType: messageContext.platform,
            credentialId,
            messageContext,
            allowLegacyThreadId,
        };
    }
    async loadLegacyMessageContext(threadId, runId) {
        try {
            return await this.messageContextService.getLatest(threadId);
        }
        catch (error) {
            this.logger.warn('Could not read the thread message context for an agent resume', {
                runId,
                error: error instanceof Error ? error.message : String(error),
            });
            return null;
        }
    }
};
exports.AgentWorkflowToolResumeService = AgentWorkflowToolResumeService;
__decorate([
    (0, decorators_1.OnLifecycleEvent)('workflowExecuteAfter'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentWorkflowToolResumeService.prototype, "handleWorkflowExecuteAfter", null);
__decorate([
    (0, decorators_1.OnPubSubEvent)('resume-agent-workflow-tool', { instanceType: 'main' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentWorkflowToolResumeService.prototype, "handleResumeRelay", null);
exports.AgentWorkflowToolResumeService = AgentWorkflowToolResumeService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, db_1.UserRepository, agent_test_run_service_1.AgentTestRunService, chat_integration_service_1.ChatIntegrationService, integration_message_context_service_1.IntegrationMessageContextService, agent_execution_update_broadcaster_1.AgentExecutionUpdateBroadcaster, n8n_checkpoint_storage_1.N8NCheckpointStorage, n8n_core_1.InstanceSettings, publisher_service_1.Publisher, agent_background_job_service_1.AgentBackgroundJobService, agent_execution_orchestrator_service_1.AgentExecutionOrchestratorService, agent_repository_1.AgentRepository])
], AgentWorkflowToolResumeService);
//# sourceMappingURL=agent-workflow-tool-resume.service.js.map