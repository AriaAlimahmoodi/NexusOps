"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentChatHitlResumeHandler = void 0;
const agent_chat_integration_1 = require("./agent-chat-integration");
const sub_agent_background_state_1 = require("../background/sub-agent-background-state");
const STALE_ACTION_NOTICE = 'This action is no longer available. The link may have expired or already been used.';
class AgentChatHitlResumeHandler {
    constructor(options) {
        this.options = options;
        this.activeResumedRuns = new Set();
    }
    async handleAction(event) {
        const { thread } = event;
        if (!thread) {
            this.options.logger.warn('[AgentChatBridge] Thread is not set for event', {
                threadId: event.threadId,
                actionId: event.actionId,
            });
            return;
        }
        const callbackData = await this.resolveCallbackData(event.actionId, event.value, thread, event.user);
        if (!callbackData)
            return;
        const parsed = this.parseActionId(callbackData.actionId, callbackData.value);
        if (!parsed)
            return;
        const backgroundApproval = (0, sub_agent_background_state_1.parseBackgroundApprovalAction)(callbackData.actionId);
        if (!backgroundApproval && !(await this.isRunResumable(parsed.runId))) {
            if (this.options.deleteActionMessageBeforeResume)
                await this.deleteActionMessage(event);
            await (0, agent_chat_integration_1.postToUserOrThread)(thread, event.user, STALE_ACTION_NOTICE);
            return;
        }
        const platformThreadId = this.options.resolvePlatformThreadId(thread);
        const threadId = this.options.toAgentThreadId(platformThreadId);
        const messageContext = this.options.messageContextBridge.capture(thread, {
            messageId: event.messageId,
            interactingUserId: event.user.userId,
            ...this.options.getPlatformAgentContext(),
            replyExpectation: 'required',
        });
        if (!backgroundApproval)
            await this.cleanUpBeforeResume(event, parsed.resumeData, callbackData);
        const resumed = await this.executeResume(thread, parsed.runId, parsed.toolCallId, parsed.resumeData, {
            messageContext,
            contextConversation: { threadId: threadId.id, resourceId: event.user.userId },
            actingUser: event.user,
        });
        if (backgroundApproval && resumed)
            await this.cleanUpBeforeResume(event, parsed.resumeData, callbackData);
    }
    parseActionId(actionId, value) {
        const backgroundApproval = (0, sub_agent_background_state_1.parseBackgroundApprovalAction)(actionId);
        if (backgroundApproval)
            return backgroundApproval;
        if (actionId.startsWith('ri-sel:')) {
            const parts = actionId.split(':');
            if (parts.length < 4) {
                this.options.logger.warn('[AgentChatBridge] Malformed ri-sel action ID', { actionId });
                return null;
            }
            return {
                runId: parts[2],
                toolCallId: parts.slice(3).join(':'),
                resumeData: { type: 'select', id: parts[1], value },
            };
        }
        if (actionId.startsWith('resume:')) {
            const parts = actionId.split(':');
            if (parts.length < 4) {
                this.options.logger.warn('[AgentChatBridge] Malformed action ID', { actionId });
                return null;
            }
            let resumeData;
            try {
                resumeData = JSON.parse(value ?? '');
            }
            catch {
                resumeData = { value };
            }
            return { runId: parts[1], toolCallId: parts.slice(2, -1).join(':'), resumeData };
        }
        return null;
    }
    async resolveCallbackData(actionId, value, thread, user) {
        if ((0, sub_agent_background_state_1.parseBackgroundApprovalAction)(actionId))
            return { actionId, value };
        if (!this.options.callbackStore)
            return { actionId, value };
        const resolved = await this.options.callbackStore.resolve(actionId);
        if (!resolved) {
            this.options.logger.warn('[AgentChatBridge] Callback key not found or expired', { actionId });
            await (0, agent_chat_integration_1.postToUserOrThread)(thread, user, STALE_ACTION_NOTICE);
            return null;
        }
        return {
            actionId: resolved.actionId,
            value: resolved.value,
            label: resolved.label,
        };
    }
    async cleanUpBeforeResume(event, resumeData, callbackData) {
        if (this.options.deleteActionMessageBeforeResume) {
            await this.deleteActionMessage(event);
            return;
        }
        try {
            const approved = this.getApprovalDecision(resumeData);
            const message = this.options.formatActionDecisionMessage?.({
                ...(approved !== undefined ? { approved } : {}),
                ...(callbackData.label !== undefined ? { selectedLabel: callbackData.label } : {}),
                raw: event.raw,
                user: event.user,
            });
            if (!message)
                return;
            if (this.options.settleActionMessage) {
                await this.options.settleActionMessage({
                    agentId: this.options.agentId,
                    integration: this.options.integration,
                    threadId: event.threadId,
                    messageId: event.messageId,
                    content: message,
                });
            }
            else {
                await event.adapter.editMessage(event.threadId, event.messageId, message);
            }
        }
        catch (editError) {
            this.options.logger.warn('[AgentChatBridge] Failed to settle action card', {
                error: editError instanceof Error ? editError.message : String(editError),
            });
        }
    }
    async deleteActionMessage(event) {
        try {
            await event.adapter.deleteMessage(event.threadId, event.messageId);
        }
        catch (deleteError) {
            this.options.logger.warn('[AgentChatBridge] Failed to delete card message', {
                error: deleteError instanceof Error ? deleteError.message : String(deleteError),
            });
        }
    }
    async isRunResumable(runId) {
        if (!this.options.agentService.isResumable)
            return true;
        try {
            return await this.options.agentService.isResumable({
                agentId: this.options.agentId,
                runId,
            });
        }
        catch (error) {
            this.options.logger.warn('[AgentChatBridge] Could not check whether a run is resumable', {
                runId,
                error: error instanceof Error ? error.message : String(error),
            });
            return true;
        }
    }
    getApprovalDecision(resumeData) {
        if (typeof resumeData !== 'object' ||
            resumeData === null ||
            !('approved' in resumeData) ||
            typeof resumeData.approved !== 'boolean') {
            return undefined;
        }
        return resumeData.approved;
    }
    async executeResume(thread, runId, toolCallId, resumeData, options = {}) {
        const { actingUser, cardRecipientId, ...context } = options;
        const cardUserId = actingUser?.userId ?? cardRecipientId;
        if (this.activeResumedRuns.has(runId)) {
            this.options.logger.warn('[AgentChatBridge] Run is already active', { runId, toolCallId });
            if (actingUser) {
                await (0, agent_chat_integration_1.postToUserOrThread)(thread, actingUser, 'This action has already been handled');
            }
            return false;
        }
        this.activeResumedRuns.add(runId);
        try {
            const resumeExecutionContext = await this.options.createResumeExecutionContext(thread);
            const statusHandle = (0, agent_chat_integration_1.onceStatusHandle)(resumeExecutionContext.statusHandle);
            try {
                const stream = this.options.agentService.resumeForChat({
                    ...context,
                    agentId: this.options.agentId,
                    projectId: this.options.projectId,
                    runId,
                    toolCallId,
                    resumeData,
                    integrationType: this.options.integration.type,
                });
                await this.options.streamConsumer.consume(stream, thread, {
                    ...resumeExecutionContext,
                    statusHandle,
                    ...(cardUserId ? { actingUserId: cardUserId } : {}),
                });
            }
            finally {
                await statusHandle?.clearBeforeResponse();
            }
            return true;
        }
        finally {
            this.activeResumedRuns.delete(runId);
        }
    }
}
exports.AgentChatHitlResumeHandler = AgentChatHitlResumeHandler;
//# sourceMappingURL=agent-chat-hitl-resume-handler.js.map