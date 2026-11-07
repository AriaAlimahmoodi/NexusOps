"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.N8N_SANDBOX_SERVICE_URL_REQUIRED_MESSAGE = void 0;
exports.normalizeSandboxProvider = normalizeSandboxProvider;
exports.requireN8nSandboxServiceUrl = requireN8nSandboxServiceUrl;
const sandbox_1 = require("@n8n/agents/sandbox");
const n8n_workflow_1 = require("n8n-workflow");
function normalizeSandboxProvider(value) {
    return (0, sandbox_1.normalizeSandboxProvider)(value);
}
exports.N8N_SANDBOX_SERVICE_URL_REQUIRED_MESSAGE = 'N8N_SANDBOX_SERVICE_URL is required when Instance AI sandbox provider is n8n-sandbox.';
function requireN8nSandboxServiceUrl(value) {
    const serviceUrl = value.trim();
    if (serviceUrl.length === 0) {
        throw new n8n_workflow_1.OperationalError(exports.N8N_SANDBOX_SERVICE_URL_REQUIRED_MESSAGE);
    }
    return serviceUrl;
}
//# sourceMappingURL=sandbox-provider.js.map