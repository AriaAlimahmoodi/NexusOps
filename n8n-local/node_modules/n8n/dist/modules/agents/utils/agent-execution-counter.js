"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAgentExecutionCounter = createAgentExecutionCounter;
function createAgentExecutionCounter(telemetry, { agentId, userId, runType, source, }) {
    const attribution = userId ? { user_id: userId } : {};
    return {
        incrementMessageCount: () => telemetry.trackAgentExecution({
            agent_id: agentId,
            ...attribution,
            run_type: runType,
            source,
            message_count: 1,
        }),
        incrementTokenCount: (tokenCount) => telemetry.trackAgentExecution({
            agent_id: agentId,
            ...attribution,
            run_type: runType,
            source,
            token_count: tokenCount,
        }),
        incrementToolCallCount: () => telemetry.trackAgentExecution({
            agent_id: agentId,
            ...attribution,
            run_type: runType,
            source,
            tool_call_count: 1,
        }),
    };
}
//# sourceMappingURL=agent-execution-counter.js.map