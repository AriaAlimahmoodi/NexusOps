"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserLocalMcpServer = void 0;
const json_schema_1 = require("@n8n/ai-utilities/json-schema");
const api_types_1 = require("@n8n/api-types");
const NO_DOMAIN = 'browser';
class BrowserLocalMcpServer {
    constructor(toolkit, toolContext, logger) {
        this.toolContext = toolContext;
        this.logger = logger;
        this.toolsByName = new Map();
        this.mcpTools = [];
        for (const tool of toolkit.tools) {
            const candidate = {
                name: tool.name,
                description: tool.description,
                inputSchema: (0, json_schema_1.zodSchemaToJsonSchema)(tool.inputSchema),
                annotations: { category: 'browser' },
            };
            const parsed = api_types_1.mcpToolSchema.safeParse(candidate);
            if (!parsed.success) {
                this.logger.warn('Skipping browser tool with unsupported input schema', {
                    tool: tool.name,
                });
                continue;
            }
            this.toolsByName.set(tool.name, tool);
            this.mcpTools.push(parsed.data);
        }
    }
    setDomainGate(gate) {
        this.gate = gate;
    }
    getAvailableTools() {
        return this.mcpTools;
    }
    getToolsByCategory(category) {
        return category === 'browser' ? this.mcpTools : [];
    }
    async callTool(req) {
        const tool = this.toolsByName.get(req.name);
        if (!tool) {
            return errorResult(`Unknown browser tool: ${req.name}`);
        }
        try {
            const { _confirmation, ...rawArgs } = req.arguments;
            const args = tool.inputSchema.parse(rawArgs);
            const gateResult = await this.gateAccess(tool, args, _confirmation);
            if (gateResult) {
                return gateResult;
            }
            const result = await tool.execute(args, this.toolContext);
            const parsed = api_types_1.mcpToolCallResultSchema.safeParse(result);
            if (parsed.success) {
                return parsed.data;
            }
            return {
                content: [{ type: 'text', text: JSON.stringify(result.content) }],
                ...(result.isError === true ? { isError: true } : {}),
            };
        }
        catch (error) {
            return errorResult(error instanceof Error ? error.message : String(error));
        }
    }
    async gateAccess(tool, args, confirmation) {
        const gate = this.gate;
        if (!gate) {
            return undefined;
        }
        const affected = await this.affectedResource(tool, args);
        if (!affected || affected.resource === NO_DOMAIN) {
            return undefined;
        }
        return affected.kind === 'credential-write'
            ? gateCredentialCreation(gate, affected, confirmation)
            : await gateDomainAccess(gate, affected, confirmation);
    }
    async affectedResource(tool, args) {
        try {
            const resources = await tool.getAffectedResources(args, this.toolContext);
            return resources[0];
        }
        catch {
            return undefined;
        }
    }
}
exports.BrowserLocalMcpServer = BrowserLocalMcpServer;
async function gateDomainAccess(gate, affected, confirmation) {
    const host = affected.resource;
    if (typeof confirmation === 'string') {
        switch (confirmation) {
            case 'allowForSession':
                await gate.tracker.approveDomain(host);
                return undefined;
            case 'allowOnce':
                gate.tracker.approveOnce(gate.runId, host);
                return undefined;
            default:
                return errorResult('Access denied by user');
        }
    }
    if (gate.permissionMode === 'blocked') {
        return errorResult('Browser access blocked by admin');
    }
    if (gate.permissionMode !== 'always_allow' && !gate.tracker.isHostAllowed(host, gate.runId)) {
        return confirmationRequiredResult(affected, ['denyOnce', 'allowOnce', 'allowForSession']);
    }
    return undefined;
}
function gateCredentialCreation(gate, affected, confirmation) {
    if (typeof confirmation === 'string') {
        return confirmation === 'allowOnce' ? undefined : errorResult('Access denied by user');
    }
    if (gate.createCredentialPermissionMode === 'blocked') {
        return errorResult('Credential creation blocked by admin');
    }
    if (gate.createCredentialPermissionMode !== 'always_allow') {
        return confirmationRequiredResult(affected, ['denyOnce', 'allowOnce']);
    }
    return undefined;
}
function confirmationRequiredResult(affected, options) {
    const payload = {
        toolGroup: affected.toolGroup,
        resource: affected.resource,
        description: affected.description,
        options,
    };
    return {
        content: [
            { type: 'text', text: `${api_types_1.GATEWAY_CONFIRMATION_REQUIRED_PREFIX}${JSON.stringify(payload)}` },
        ],
        isError: true,
    };
}
function errorResult(message) {
    return { content: [{ type: 'text', text: message }], isError: true };
}
//# sourceMappingURL=browser-local-mcp-server.js.map