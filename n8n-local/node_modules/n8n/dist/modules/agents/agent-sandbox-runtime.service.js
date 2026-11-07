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
exports.AgentSandboxRuntimeService = void 0;
exports.sanitizeSandboxErrorDetail = sanitizeSandboxErrorDetail;
const sandbox_1 = require("@n8n/agents/sandbox");
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const redact_text_1 = require("@n8n/utils/redaction/redact-text");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const nanoid_1 = require("nanoid");
const uuid_1 = require("uuid");
const ai_service_1 = require("../../services/ai.service");
const sandbox_settings_service_1 = require("../../services/sandbox-settings.service");
const ai_service_retry_1 = require("../../utils/ai-service-retry");
const agent_knowledge_storage_1 = require("./agent-knowledge-storage");
const agent_repository_1 = require("./repositories/agent.repository");
const get_agent_or_throw_1 = require("./utils/get-agent-or-throw");
const WORKSPACE_SANDBOX_NAMESPACE = '38348f53-e947-42c7-8c04-83aa154be385';
const KNOWLEDGE_SANDBOX_NAMESPACE = '51989c13-3ae7-4167-8e64-d874dd068795';
const WORKSPACE_SANDBOX_NAME_PREFIX = 'agent-ws-';
const KNOWLEDGE_SANDBOX_NAME_PREFIX = 'agent-kb-';
const MAX_SANDBOX_ERROR_DETAIL_CHARS = 2_000;
const LABEL_KNOWLEDGE_BASE = 'n8n-agents-knowledgebase';
const LABEL_PROJECT_ID = 'n8n-project-id';
const LABEL_AGENT_ID = 'n8n-agent-id';
const LABEL_SANDBOX_KIND = 'n8n-agent-sandbox-kind';
const LABEL_PRINCIPAL_HASH = 'n8n-agent-principal-hash';
const DEFAULT_SANDBOX_IMAGE = 'daytonaio/sandbox:0.5.0';
const WORKSPACE_AUTO_STOP_INTERVAL_MINUTES = 5;
const WORKSPACE_AUTO_ARCHIVE_INTERVAL_MINUTES = 60;
const WORKSPACE_AUTO_DELETE_INTERVAL_MINUTES = 24 * 60;
const KNOWLEDGE_AUTO_STOP_INTERVAL_MINUTES = 15;
const KNOWLEDGE_AUTO_ARCHIVE_INTERVAL_MINUTES = 60;
const KNOWLEDGE_AUTO_DELETE_INTERVAL_MINUTES = 7 * 24 * 60;
function buildWorkspaceSandboxId(scope) {
    return (0, uuid_1.v5)(JSON.stringify([scope.instanceId, scope.projectId, scope.agentId, scope.principalHash]), WORKSPACE_SANDBOX_NAMESPACE);
}
function buildKnowledgeSandboxId(scope) {
    return (0, uuid_1.v5)(JSON.stringify([scope.instanceId, scope.projectId, scope.agentId]), KNOWLEDGE_SANDBOX_NAMESPACE);
}
function buildWorkspaceLabels(projectId, agentId, principalHash) {
    return {
        [LABEL_PROJECT_ID]: projectId,
        [LABEL_AGENT_ID]: agentId,
        [LABEL_SANDBOX_KIND]: 'workspace',
        [LABEL_PRINCIPAL_HASH]: principalHash,
    };
}
function buildKnowledgeLabels(projectId, agentId) {
    return {
        [LABEL_KNOWLEDGE_BASE]: 'true',
        [LABEL_PROJECT_ID]: projectId,
        [LABEL_AGENT_ID]: agentId,
        [LABEL_SANDBOX_KIND]: 'knowledge',
    };
}
function truncateSandboxErrorDetail(value) {
    if (value.length <= MAX_SANDBOX_ERROR_DETAIL_CHARS)
        return value;
    return `${value.slice(0, MAX_SANDBOX_ERROR_DETAIL_CHARS)}...[truncated]`;
}
function sanitizeSandboxErrorDetail(value) {
    return truncateSandboxErrorDetail((0, redact_text_1.redactText)(value).text.trimEnd());
}
let AgentSandboxRuntimeService = class AgentSandboxRuntimeService {
    constructor(agentsConfig, logger, aiService, instanceSettings, agentRepository, sandboxSettingsService) {
        this.agentsConfig = agentsConfig;
        this.logger = logger;
        this.aiService = aiService;
        this.instanceSettings = instanceSettings;
        this.agentRepository = agentRepository;
        this.sandboxSettingsService = sandboxSettingsService;
        this.pendingSandboxAcquisitions = new Map();
    }
    async warmKnowledgeSandbox(projectId, agentId) {
        this.assertSandboxConfiguration(projectId, agentId);
        await this.acquireKnowledgeSandbox(projectId, agentId);
    }
    async destroyWorkspaceSandbox(projectId, agentId, principalHash) {
        const sandboxId = buildWorkspaceSandboxId({
            instanceId: this.instanceSettings.instanceId,
            projectId,
            agentId,
            principalHash,
        });
        await this.destroySandboxByIdentity(projectId, agentId, `${WORKSPACE_SANDBOX_NAME_PREFIX}${sandboxId}`, sandboxId, buildWorkspaceLabels(projectId, agentId, principalHash));
    }
    async destroyKnowledgeSandbox(projectId, agentId) {
        const sandboxId = buildKnowledgeSandboxId({
            instanceId: this.instanceSettings.instanceId,
            projectId,
            agentId,
        });
        await this.destroySandboxByIdentity(projectId, agentId, `${KNOWLEDGE_SANDBOX_NAME_PREFIX}${sandboxId}`, sandboxId, buildKnowledgeLabels(projectId, agentId));
    }
    async acquireWorkspaceSandbox(projectId, agentId, principalHash, options) {
        const provider = this.sandboxSettingsService.getProvider();
        const sandboxId = buildWorkspaceSandboxId({
            instanceId: this.instanceSettings.instanceId,
            projectId,
            agentId,
            principalHash,
        });
        return await this.acquireSandboxByIdentity(projectId, agentId, provider, `${WORKSPACE_SANDBOX_NAME_PREFIX}${sandboxId}`, sandboxId, buildWorkspaceLabels(projectId, agentId, principalHash), `${provider}:workspace:${sandboxId}`, {
            ephemeral: false,
            autoStopInterval: WORKSPACE_AUTO_STOP_INTERVAL_MINUTES,
            autoArchiveInterval: WORKSPACE_AUTO_ARCHIVE_INTERVAL_MINUTES,
            autoDeleteInterval: WORKSPACE_AUTO_DELETE_INTERVAL_MINUTES,
        }, {
            eagerStart: false,
            ...(options?.onFilesystemInit ? { onFilesystemInit: options.onFilesystemInit } : {}),
        });
    }
    async acquireKnowledgeSandbox(projectId, agentId) {
        const provider = this.sandboxSettingsService.getProvider();
        const sandboxId = buildKnowledgeSandboxId({
            instanceId: this.instanceSettings.instanceId,
            projectId,
            agentId,
        });
        return await this.acquireSandboxByIdentity(projectId, agentId, provider, `${KNOWLEDGE_SANDBOX_NAME_PREFIX}${sandboxId}`, sandboxId, buildKnowledgeLabels(projectId, agentId), `${provider}:knowledge:${sandboxId}`, {
            ephemeral: this.agentsConfig.sandboxEphemeral,
            autoStopInterval: KNOWLEDGE_AUTO_STOP_INTERVAL_MINUTES,
            autoArchiveInterval: KNOWLEDGE_AUTO_ARCHIVE_INTERVAL_MINUTES,
            ...(this.agentsConfig.sandboxEphemeral
                ? {}
                : { autoDeleteInterval: KNOWLEDGE_AUTO_DELETE_INTERVAL_MINUTES }),
        }, { eagerStart: true });
    }
    async acquireSandboxByIdentity(projectId, agentId, provider, daytonaName, n8nSandboxId, labels, cacheKey, lifecycle, startOptions) {
        let pending = this.pendingSandboxAcquisitions.get(cacheKey);
        if (!pending) {
            pending = this.acquireSandboxFresh(projectId, agentId, provider, daytonaName, n8nSandboxId, labels, cacheKey, lifecycle, startOptions).finally(() => {
                this.pendingSandboxAcquisitions.delete(cacheKey);
            });
            this.pendingSandboxAcquisitions.set(cacheKey, pending);
        }
        return await pending;
    }
    async executeSandboxCommand(sandbox, command, timeout) {
        if (!sandbox.executeCommand) {
            throw new n8n_workflow_1.OperationalError('Agent knowledge sandbox does not support command execution');
        }
        return await sandbox.executeCommand(command, [], { timeout });
    }
    isEnabled() {
        return this.sandboxSettingsService.isAgentSandboxEnabled();
    }
    assertSandboxConfiguration(projectId, agentId) {
        if (!this.isEnabled()) {
            throw new n8n_workflow_1.OperationalError('Agent knowledge sandbox is not enabled');
        }
        this.assertValidPathSegments(projectId, agentId);
    }
    async destroySandboxByIdentity(projectId, agentId, daytonaName, n8nSandboxId, labels) {
        const sandboxes = [
            ['daytona', daytonaName],
            ['n8n-sandbox', n8nSandboxId],
        ];
        for (const [provider, sandboxId] of sandboxes) {
            await this.tryDestroySandbox(projectId, agentId, provider, sandboxId, labels);
        }
    }
    async tryDestroySandbox(projectId, agentId, provider, sandboxId, labels) {
        try {
            const config = provider === 'daytona'
                ? await this.resolveDaytonaSandboxConfig(projectId, sandboxId, labels)
                : await this.resolveN8nSandboxConfig(sandboxId);
            const sandbox = await (0, sandbox_1.createSandbox)(config, { logger: this.logger });
            if (!sandbox?.deleteRemote) {
                throw new n8n_workflow_1.OperationalError('Agent knowledge sandbox does not support provider destroy');
            }
            await sandbox.deleteRemote();
        }
        catch (error) {
            this.logger.warn('Failed to destroy agent knowledge sandbox', {
                projectId,
                agentId,
                provider,
                sandboxId,
                error: sanitizeSandboxErrorDetail(error instanceof Error ? error.message : String(error)),
            });
        }
    }
    async acquireSandboxFresh(projectId, agentId, provider, daytonaName, n8nSandboxId, labels, cacheKey, lifecycle, startOptions) {
        await (0, get_agent_or_throw_1.getAgentOrThrow)(this.agentRepository, agentId, projectId);
        const config = provider === 'daytona'
            ? await this.resolveDaytonaSandboxConfig(projectId, daytonaName, labels, lifecycle)
            : await this.resolveN8nSandboxConfig(n8nSandboxId, lifecycle);
        return await this.startSandbox(config, projectId, agentId, cacheKey, startOptions);
    }
    async startSandbox(config, projectId, agentId, cacheKey, startOptions) {
        const { provider } = config;
        const sandbox = await (0, sandbox_1.createSandbox)(config, { logger: this.logger });
        if (!sandbox?._start) {
            throw new n8n_workflow_1.OperationalError('Agent knowledge sandbox does not support lifecycle start');
        }
        if (startOptions.eagerStart) {
            await sandbox._start();
        }
        const filesystem = (0, sandbox_1.createFilesystem)(sandbox, startOptions.onFilesystemInit ? { onInit: startOptions.onFilesystemInit } : undefined);
        const workspaceRoot = (0, sandbox_1.getPromptWorkspaceRoot)(provider);
        this.logger.debug('Acquired agent sandbox', {
            projectId,
            agentId,
            provider,
            sandboxId: sandbox.id,
            started: startOptions.eagerStart,
        });
        return {
            provider,
            sandbox,
            filesystem,
            workspaceRoot,
            cacheKey: `${cacheKey}:${sandbox.id}`,
        };
    }
    async resolveDaytonaSandboxConfig(projectId, sandboxId, labels, lifecycle = {}) {
        const directImage = this.agentsConfig.sandboxImage || DEFAULT_SANDBOX_IMAGE;
        const snapshot = this.agentsConfig.sandboxSnapshot.trim() || undefined;
        const baseConfig = {
            enabled: true,
            provider: 'daytona',
            id: sandboxId,
            name: sandboxId,
            labels,
            timeout: this.agentsConfig.sandboxTimeout,
            createTimeoutSeconds: Math.ceil(this.agentsConfig.sandboxTimeout / 1000),
            ...lifecycle,
        };
        if (!this.aiService.isProxyEnabled()) {
            const daytona = await this.sandboxSettingsService.resolveDaytonaConfig();
            return {
                ...baseConfig,
                daytonaApiUrl: daytona.apiUrl,
                daytonaApiKey: daytona.apiKey,
                image: directImage,
                snapshot,
            };
        }
        const client = await this.aiService.getClient();
        if (!snapshot) {
            throw new n8n_workflow_1.OperationalError('Agent knowledge sandbox requires a snapshot when Daytona is reached through the AI service proxy. Set N8N_AGENTS_AI_SANDBOX_SNAPSHOT to a snapshot available to the instance.');
        }
        return {
            ...baseConfig,
            daytonaApiUrl: client.getSandboxProxyBaseUrl(),
            snapshot,
            getAuthToken: async () => {
                const token = await (0, ai_service_retry_1.callAiServiceWithRetry)('Agent knowledge sandbox proxy token mint', async () => await client.getBuilderApiProxyToken({ id: projectId }, { userMessageId: (0, nanoid_1.nanoid)() }), this.logger);
                return token.accessToken;
            },
        };
    }
    async resolveN8nSandboxConfig(sandboxId, lifecycle = {}) {
        const { serviceUrl, apiKey } = await this.sandboxSettingsService.resolveN8nSandboxConfig();
        const normalizedServiceUrl = serviceUrl?.trim();
        if (!normalizedServiceUrl) {
            throw new n8n_workflow_1.OperationalError('Agent knowledge sandbox requires the n8n sandbox service URL. Set N8N_SANDBOX_SERVICE_URL.');
        }
        return {
            enabled: true,
            provider: 'n8n-sandbox',
            id: sandboxId,
            serviceUrl: normalizedServiceUrl,
            apiKey,
            timeout: this.agentsConfig.sandboxTimeout,
            ephemeral: lifecycle.ephemeral,
        };
    }
    assertValidPathSegments(projectId, agentId) {
        try {
            (0, agent_knowledge_storage_1.assertKnowledgePathSegment)(this.instanceSettings.instanceId, 'instance id');
            (0, agent_knowledge_storage_1.assertKnowledgePathSegment)(projectId, 'project id');
            (0, agent_knowledge_storage_1.assertKnowledgePathSegment)(agentId, 'agent id');
        }
        catch (error) {
            throw new n8n_workflow_1.OperationalError(error instanceof Error ? error.message : 'Invalid agent knowledge storage scope');
        }
    }
};
exports.AgentSandboxRuntimeService = AgentSandboxRuntimeService;
exports.AgentSandboxRuntimeService = AgentSandboxRuntimeService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.AgentsConfig, backend_common_1.Logger, ai_service_1.AiService, n8n_core_1.InstanceSettings, agent_repository_1.AgentRepository, sandbox_settings_service_1.SandboxSettingsService])
], AgentSandboxRuntimeService);
//# sourceMappingURL=agent-sandbox-runtime.service.js.map