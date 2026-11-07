import type { InstanceAiConfig } from '@n8n/config';
import type { User } from '@n8n/db';
import { createSandbox, createWorkspace, type ServiceProxyConfig, type InstanceAiContext, type Logger, type ManagedBackgroundTask, type SandboxConfig, type VerifiedWorkspaceBundles } from '@n8n/instance-ai';
import type { ErrorReporter } from 'n8n-core';
export type RuntimeSandboxEntry = {
    userId: string;
    sandbox: NonNullable<Awaited<ReturnType<typeof createSandbox>>>;
    workspace: NonNullable<ReturnType<typeof createWorkspace>>;
    configFingerprint: string;
    verifiedBundles: VerifiedWorkspaceBundles;
    setupComplete: boolean;
    setupPromise: Promise<void> | undefined;
    expiresAt: number;
    cleanupTimer?: ReturnType<typeof setTimeout>;
};
export type InstanceAiSandboxRunState = {
    getActiveRunId: (threadId: string) => string | undefined;
    hasSuspendedRun: (threadId: string) => boolean;
};
export type InstanceAiSandboxBackgroundTasks = {
    getRunningTasks: (threadId: string) => ManagedBackgroundTask[];
};
export type InstanceAiSandboxSettings = {
    resolveDaytonaConfig: () => Promise<{
        apiUrl?: string;
        apiKey?: string;
    }>;
    resolveN8nSandboxConfig: () => Promise<{
        serviceUrl?: string;
        apiKey?: string;
    }>;
};
export type InstanceAiSandboxProxy = {
    isProxyEnabled: () => boolean;
    getClient: () => Promise<{
        getSandboxProxyConfig: () => Promise<{
            image?: string;
        }>;
        getSandboxProxyBaseUrl: () => string;
        getInstanceAiApiProxyToken: (user: {
            id: string;
        }, options: {
            userMessageId: string;
        }) => Promise<{
            accessToken: string;
        }>;
    }>;
};
export type InstanceAiSandboxServiceOptions = {
    config: InstanceAiConfig;
    logger: Logger;
    errorReporter: ErrorReporter;
    runState: InstanceAiSandboxRunState;
    backgroundTasks: InstanceAiSandboxBackgroundTasks;
    settingsService: InstanceAiSandboxSettings;
    aiService: InstanceAiSandboxProxy;
    resolveTracingConfig?: (threadId: string, userId?: string) => Promise<{
        userId: string;
        proxyConfig?: ServiceProxyConfig;
    }>;
};
export declare class InstanceAiSandboxService {
    private readonly options;
    private readonly sandboxes;
    private readonly sandboxCreations;
    private cacheGeneration;
    constructor(options: InstanceAiSandboxServiceOptions);
    private get logger();
    private get instanceAiConfig();
    getSandboxConfigFromEnv(): SandboxConfig;
    resolveSandboxConfig(user: User): Promise<SandboxConfig>;
    getOrCreateWorkspaceEntry(threadId: string, user: User): Promise<RuntimeSandboxEntry | undefined>;
    getOrCreateWorkspace(threadId: string, user: User, context: InstanceAiContext): Promise<RuntimeSandboxEntry | undefined>;
    private ensureWorkspaceSetup;
    private createWorkspaceEntry;
    private resolveSandboxCacheState;
    invalidateCachedWorkspaces(): void;
    private evictSandboxEntry;
    destroySandbox(threadId: string, reason?: string, userId?: string): Promise<void>;
    private destroyUncachedSandbox;
    private lifecycleTraceConfig;
    private get sandboxTtlMs();
    private nextSandboxExpiry;
    private isSandboxEntryExpired;
    private touchSandboxEntry;
    private isSandboxInUse;
    private scheduleSandboxExpiry;
    stopSandboxExpiryTimers(): void;
}
