"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toAgentRef = toAgentRef;
function toAgentRef(agent, schema = agent.activeVersion
    ?.schema) {
    const personalisation = schema?.personalisation;
    return {
        id: agent.id,
        name: agent.name,
        ...(personalisation ? { personalisation } : {}),
    };
}
//# sourceMappingURL=agent-ref.js.map