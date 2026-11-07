import { type CommandResult, type FilesystemLifecycleHook, type SandboxProvider, type WorkspaceFilesystem, type WorkspaceSandbox } from '@n8n/agents/sandbox';
import { Logger } from '@n8n/backend-common';
import { AgentsConfig } from '@n8n/config';
import { InstanceSettings } from 'n8n-core';
import { AiService } from '../../services/ai.service';
import { SandboxSettingsService } from '../../services/sandbox-settings.service';
import type { AgentSandboxPrincipalHash } from './agent-sandbox-principal';
import { AgentRepository } from './repositories/agent.repository';
export interface AgentSandboxRuntime {
    provider: SandboxProvider;
    sandbox: WorkspaceSandbox;
    filesystem: WorkspaceFilesystem;
    workspaceRoot: string;
    cacheKey: string;
}
export declare function sanitizeSandboxErrorDetail(value: string): string;
export declare class AgentSandboxRuntimeService {
    private readonly agentsConfig;
    private readonly logger;
    private readonly aiService;
    private readonly instanceSettings;
    private readonly agentRepository;
    private readonly sandboxSettingsService;
    private readonly pendingSandboxAcquisitions;
    constructor(agentsConfig: AgentsConfig, logger: Logger, aiService: AiService, instanceSettings: InstanceSettings, agentRepository: AgentRepository, sandboxSettingsService: SandboxSettingsService);
    warmKnowledgeSandbox(projectId: string, agentId: string): Promise<void>;
    destroyWorkspaceSandbox(projectId: string, agentId: string, principalHash: AgentSandboxPrincipalHash): Promise<void>;
    destroyKnowledgeSandbox(projectId: string, agentId: string): Promise<void>;
    acquireWorkspaceSandbox(projectId: string, agentId: string, principalHash: AgentSandboxPrincipalHash, options?: {
        onFilesystemInit?: FilesystemLifecycleHook;
    }): Promise<AgentSandboxRuntime>;
    acquireKnowledgeSandbox(projectId: string, agentId: string): Promise<AgentSandboxRuntime>;
    private acquireSandboxByIdentity;
    executeSandboxCommand(sandbox: WorkspaceSandbox, command: string, timeout: number): Promise<CommandResult>;
    isEnabled(): boolean;
    assertSandboxConfiguration(projectId: string, agentId: string): void;
    private destroySandboxByIdentity;
    private tryDestroySandbox;
    private acquireSandboxFresh;
    private startSandbox;
    private resolveDaytonaSandboxConfig;
    private resolveN8nSandboxConfig;
    private assertValidPathSegments;
}
