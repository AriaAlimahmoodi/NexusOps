"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeToolName = void 0;
exports.composeJsonConfig = composeJsonConfig;
exports.decomposeJsonConfig = decomposeJsonConfig;
var api_types_1 = require("@n8n/api-types");
Object.defineProperty(exports, "sanitizeToolName", { enumerable: true, get: function () { return api_types_1.sanitizeAgentToolName; } });
const agent_document_1 = require("./agent-document");
function composeJsonConfig(agent, skillRefs) {
    if (!agent.schema)
        return null;
    return {
        ...(0, agent_document_1.toAgentDocument)(agent.schema, skillRefs),
        integrations: agent.integrations ?? [],
    };
}
function decomposeJsonConfig(config) {
    const { integrations, ...schemaConfig } = config;
    return {
        schemaConfig,
        integrations: integrations ?? [],
    };
}
//# sourceMappingURL=agent-config-composition.js.map