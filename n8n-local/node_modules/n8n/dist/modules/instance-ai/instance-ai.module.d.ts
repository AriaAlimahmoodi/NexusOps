import type { ModuleInterface } from '@n8n/decorators';
export declare class InstanceAiModule implements ModuleInterface {
    init(): Promise<void>;
    systemTasks(): Promise<typeof import("./instance-ai-checkpoint-pruning.task.js").InstanceAiCheckpointPruningTask[]>;
    settings(): Promise<{
        enabled: boolean;
        mcpConnectionsAvailable: boolean;
        localGatewayDisabled: boolean;
        browserUseEnabled: boolean;
        proxyEnabled: boolean;
        cloudManaged: boolean;
        setupCompleted: boolean;
        sandboxEnabled: boolean;
        workflowBuilderAvailable: boolean;
        sandboxUnavailableReason: string | null;
        runDebugEnabled: boolean;
    }>;
    entities(): Promise<(typeof import("./entities/instance-ai-thread.entity.js").InstanceAiThread | typeof import("./entities/instance-ai-event-log-entry.entity.js").InstanceAiEventLogEntry | typeof import("./entities/instance-ai-checkpoint.entity.js").InstanceAiCheckpoint | typeof import("./entities/instance-ai-message.entity.js").InstanceAiMessage | typeof import("./entities/instance-ai-pending-confirmation.entity.js").InstanceAiPendingConfirmation | typeof import("./entities/instance-ai-observation-lock.entity.js").InstanceAiObservationLock | typeof import("./entities/instance-ai-observation.entity.js").InstanceAiObservation | typeof import("./entities/instance-ai-observation-cursor.entity.js").InstanceAiObservationCursor | typeof import("./entities/instance-ai-resource.entity.js").InstanceAiResource | typeof import("./entities/instance-ai-mcp-registry-connection.entity.js").InstanceAiMcpRegistryConnection | typeof import("./entities/instance-ai-thread-tabs.entity.js").InstanceAiThreadTabs | typeof import("./entities/instance-ai-thread-grant.entity.js").InstanceAiThreadGrant | typeof import("./entities/instance-ai-iteration-log.entity.js").InstanceAiIterationLog | typeof import("./workflow-suggestions/database/workflow-suggestion.entity.js").WorkflowSuggestion | typeof import("./workflow-suggestions/database/workflow-suggestion-activity.entity.js").WorkflowSuggestionActivity | typeof import("./self-healing/database/self-healing-result.entity.js").SelfHealingResult)[]>;
    shutdown(): Promise<void>;
}
