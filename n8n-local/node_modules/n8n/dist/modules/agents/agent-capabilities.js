"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AGENT_LIMITATIONS = exports.AGENT_CAPABILITIES = void 0;
exports.AGENT_CAPABILITIES = [
    'Call tools — n8n nodes, attached workflows, or custom code tools — to take actions and query services.',
    'Connect to MCP servers to expose external tool catalogs.',
    'Use skills — reusable instruction bundles — to extend its behavior.',
    'Run scheduled tasks (e.g. a daily summary) without a chat trigger.',
    'Delegate to published sub-agents for specialized work.',
    'Use memory and vector stores to recall context and search documents.',
    'Be triggered from a supported chat channel (see `channels`) or Preview.',
];
exports.AGENT_LIMITATIONS = [
    'Agents cannot create n8n workflows or data tables; attach existing workflows only.',
    'Chat channels must come from the channels field of this result — any other channel is unsupported.',
];
//# sourceMappingURL=agent-capabilities.js.map