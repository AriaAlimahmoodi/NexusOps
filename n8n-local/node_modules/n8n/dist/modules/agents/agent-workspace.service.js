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
exports.AgentWorkspaceService = void 0;
const posix_1 = require("node:path/posix");
const agents_1 = require("@n8n/agents");
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const di_1 = require("@n8n/di");
const agent_sandbox_runtime_service_1 = require("./agent-sandbox-runtime.service");
const n8n_checkpoint_storage_1 = require("./integrations/n8n-checkpoint-storage");
let AgentWorkspaceService = class AgentWorkspaceService {
    constructor(logger, agentSandboxRuntimeService, checkpointStorage, agentsConfig) {
        this.logger = logger;
        this.agentSandboxRuntimeService = agentSandboxRuntimeService;
        this.checkpointStorage = checkpointStorage;
        this.agentsConfig = agentsConfig;
        this.pendingReconciliations = new Set();
    }
    async getAgentWorkspace(projectId, agentId, principalHash) {
        this.agentSandboxRuntimeService.assertSandboxConfiguration(projectId, agentId);
        const runtime = await this.agentSandboxRuntimeService.acquireWorkspaceSandbox(projectId, agentId, principalHash, {
            onFilesystemInit: ({ filesystem }) => {
                this.reconcileToolResultsInBackground(runtime.cacheKey, projectId, agentId, principalHash, (0, agents_1.createScopedWorkspace)(new agents_1.Workspace({ filesystem, sandbox: runtime.sandbox }), runtime.workspaceRoot));
            },
        });
        const workspace = (0, agents_1.createScopedWorkspace)(new agents_1.Workspace({ filesystem: runtime.filesystem, sandbox: runtime.sandbox }), runtime.workspaceRoot, undefined, { ensureRootExists: true });
        return { workspace: this.withCoreToolsOnly(workspace), handle: runtime };
    }
    getDelegatedAgentWorkspace(handle, delegationThreadId) {
        const root = (0, posix_1.join)(handle.workspaceRoot, 'subagents', delegationThreadId);
        const workspace = (0, agents_1.createScopedWorkspace)(new agents_1.Workspace({ filesystem: handle.filesystem, sandbox: handle.sandbox }), root, undefined, { ensureRootExists: true });
        return this.withCoreToolsOnly(workspace);
    }
    withCoreToolsOnly(workspace) {
        const getTools = workspace.getTools.bind(workspace);
        workspace.getTools = () => getTools().filter((tool) => agents_1.CORE_WORKSPACE_TOOL_NAMES.has(tool.name));
        return workspace;
    }
    reconcileToolResultsInBackground(cacheKey, projectId, agentId, principalHash, workspace) {
        if (this.pendingReconciliations.has(cacheKey))
            return;
        this.pendingReconciliations.add(cacheKey);
        void (async () => {
            const activeRunIds = await this.checkpointStorage.getActiveRunIdsForSandbox(agentId, principalHash);
            if (activeRunIds !== n8n_checkpoint_storage_1.CHECKPOINT_RECONCILIATION_OVERFLOW && workspace.filesystem) {
                await (0, agents_1.reconcileToolResultRuns)(workspace.filesystem, activeRunIds, this.agentsConfig.checkpointTtlSeconds * constants_1.Time.seconds.toMilliseconds);
            }
        })()
            .catch((error) => {
            this.logger.warn('Failed to reconcile agent workspace tool results', {
                projectId,
                agentId,
                error: (0, agent_sandbox_runtime_service_1.sanitizeSandboxErrorDetail)(error instanceof Error ? error.message : String(error)),
            });
        })
            .finally(() => {
            this.pendingReconciliations.delete(cacheKey);
        });
    }
};
exports.AgentWorkspaceService = AgentWorkspaceService;
exports.AgentWorkspaceService = AgentWorkspaceService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, agent_sandbox_runtime_service_1.AgentSandboxRuntimeService, n8n_checkpoint_storage_1.N8NCheckpointStorage, config_1.AgentsConfig])
], AgentWorkspaceService);
//# sourceMappingURL=agent-workspace.service.js.map