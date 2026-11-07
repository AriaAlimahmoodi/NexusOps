"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildInstanceAiRunTraceMetadata = buildInstanceAiRunTraceMetadata;
const RUN_TIMEOUT_REASON = 'timeout';
function withFirstToolName(state, firstToolName) {
    return firstToolName ? { state, firstToolName } : { state };
}
function getFirstToolName(events) {
    for (const event of events) {
        if (event.type === 'tool-call')
            return event.payload.toolName;
    }
    return undefined;
}
function getFirstVisibleSummary(events) {
    const firstToolName = getFirstToolName(events);
    let sawToolCall = false;
    for (const event of events) {
        if (event.type === 'tool-call') {
            sawToolCall = true;
            continue;
        }
        if (event.type === 'confirmation-request') {
            return {
                state: 'contextless_hitl',
                firstToolName: firstToolName ?? event.payload.toolName,
            };
        }
        if ((event.type === 'text-delta' || event.type === 'text-block') &&
            event.payload.text.trim().length > 0) {
            return withFirstToolName('assistant_text', firstToolName);
        }
        if (event.type === 'agent-spawned' || event.type === 'tasks-update') {
            return withFirstToolName('task_card', firstToolName);
        }
    }
    return withFirstToolName(sawToolCall ? 'tool_call' : 'empty', firstToolName);
}
function getCancellationType(options) {
    if (options.status !== 'cancelled')
        return undefined;
    if (options.runTimeout?.timedOut || options.cancellationReason === RUN_TIMEOUT_REASON) {
        return options.runTimeout?.details?.reason ?? 'idle_timeout';
    }
    return 'explicit';
}
function buildInstanceAiRunTraceMetadata(events, options) {
    const firstVisible = getFirstVisibleSummary(events);
    const metadata = {
        first_visible_state: firstVisible.state,
    };
    if (firstVisible.firstToolName) {
        metadata.first_tool_name = firstVisible.firstToolName;
    }
    const cancellationType = getCancellationType(options);
    if (cancellationType) {
        metadata.cancellation_type = cancellationType;
    }
    if (options.runTimeout?.details?.idleMs !== undefined) {
        metadata.idle_tail_ms = Math.round(options.runTimeout.details.idleMs);
    }
    return metadata;
}
//# sourceMappingURL=run-trace-metadata.js.map