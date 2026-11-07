"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveAgentPreviewHandoff = resolveAgentPreviewHandoff;
const n8n_workflow_1 = require("n8n-workflow");
const internal_messages_1 = require("./internal-messages");
const ESCAPED_AGENT_PREVIEW_CONTEXT_OPEN_TAG = '&lt;agent-preview-context&gt;';
const ESCAPED_AGENT_PREVIEW_CONTEXT_CLOSE_TAG = '&lt;/agent-preview-context&gt;';
function escapeAgentPreviewContextDelimiters(value) {
    return value
        .replaceAll(internal_messages_1.AGENT_PREVIEW_CONTEXT_OPEN_TAG, ESCAPED_AGENT_PREVIEW_CONTEXT_OPEN_TAG)
        .replaceAll(internal_messages_1.AGENT_PREVIEW_CONTEXT_CLOSE_TAG, ESCAPED_AGENT_PREVIEW_CONTEXT_CLOSE_TAG);
}
async function resolveAgentPreviewHandoff(context, options) {
    const detail = await options.getThreadDetail(context.threadId, options.projectId, context.agentId, options.userId);
    if (!detail) {
        throw new n8n_workflow_1.UserError('Preview session not found');
    }
    if (context.executionId &&
        !detail.executions.some((execution) => execution.id === context.executionId)) {
        throw new n8n_workflow_1.UserError('Preview session turn not found');
    }
    const trimmedTitle = detail.thread.title?.trim() ?? '';
    const titleFallback = trimmedTitle.length > 0 ? trimmedTitle : `Session #${detail.thread.sessionNumber}`;
    const sessionLabel = trimmedTitle.length > 0
        ? `"${trimmedTitle}" (session #${detail.thread.sessionNumber})`
        : `session #${detail.thread.sessionNumber}`;
    const safeSessionLabel = escapeAgentPreviewContextDelimiters(sessionLabel);
    const refJson = JSON.stringify({
        source: context.source,
        agentId: context.agentId,
        threadId: context.threadId,
        ...(context.executionId ? { executionId: context.executionId } : {}),
        ...(context.agentName
            ? { agentName: escapeAgentPreviewContextDelimiters(context.agentName) }
            : {}),
        ...(context.agentIcon
            ? { agentIcon: escapeAgentPreviewContextDelimiters(context.agentIcon) }
            : {}),
        ...(context.sessionTitle
            ? { sessionTitle: escapeAgentPreviewContextDelimiters(context.sessionTitle) }
            : {}),
    });
    const prose = [
        `The user shared a real preview-chat transcript for agent \`${context.agentId}\` (${safeSessionLabel}).`,
        'Call `get-session` to read the transcript before commenting on the agent.',
        'For review/analysis requests (e.g. "review the tone", "assess behavior"), answer directly from the transcript — do NOT modify the agent.',
        'Only change the agent when the user explicitly asks to update, improve, or fix it. Then load the `agent-builder` skill and call `agent_builder_select_agent` with this `agentId` before any other builder tool.',
    ].join('\n');
    const block = [
        internal_messages_1.AGENT_PREVIEW_CONTEXT_OPEN_TAG,
        refJson,
        '',
        prose,
        internal_messages_1.AGENT_PREVIEW_CONTEXT_CLOSE_TAG,
    ].join('\n');
    return {
        block,
        titleFallback,
        target: { agentId: context.agentId, projectId: options.projectId },
    };
}
//# sourceMappingURL=agent-preview-handoff.js.map