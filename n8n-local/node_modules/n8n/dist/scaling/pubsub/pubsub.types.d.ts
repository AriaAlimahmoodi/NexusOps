import type { Resolve } from '../../utlity.types';
import type { PubSubCommandMap, PubSubWorkerResponseMap } from './pubsub.event-map';
import type { COMMAND_PUBSUB_CHANNEL, WORKER_RESPONSE_PUBSUB_CHANNEL } from '../constants';
export declare namespace PubSub {
    export type Channel = typeof COMMAND_PUBSUB_CHANNEL | typeof WORKER_RESPONSE_PUBSUB_CHANNEL;
    export type HandlerFn = (msg: string) => void;
    type _ToCommand<CommandKey extends keyof PubSubCommandMap> = {
        command: CommandKey;
        senderId?: string;
        targets?: string[];
        selfSend?: boolean;
        debounce?: boolean;
    } & (PubSubCommandMap[CommandKey] extends never ? {
        payload?: never;
    } : {
        payload: PubSubCommandMap[CommandKey];
    });
    type ToCommand<CommandKey extends keyof PubSubCommandMap> = Resolve<_ToCommand<CommandKey>>;
    namespace Commands {
        type ReloadLicense = ToCommand<'reload-license'>;
        type ReloadOIDCConfiguration = ToCommand<'reload-oidc-config'>;
        type ReloadSamlConfiguration = ToCommand<'reload-saml-config'>;
        type ReloadOAuthSigningKeys = ToCommand<'reload-oauth-signing-keys'>;
        type ReloadCredentialsOverwrites = ToCommand<'reload-overwrite-credentials'>;
        type RestartEventBus = ToCommand<'restart-event-bus'>;
        type ReloadExternalSecretsProviders = ToCommand<'reload-external-secrets-providers'>;
        type CommunityPackageInstall = ToCommand<'community-package-install'>;
        type CommunityPackageUpdate = ToCommand<'community-package-update'>;
        type CommunityPackageUninstall = ToCommand<'community-package-uninstall'>;
        type GetWorkerId = ToCommand<'get-worker-id'>;
        type GetWorkerStatus = ToCommand<'get-worker-status'>;
        type StopExecution = ToCommand<'stop-execution'>;
        type AddWebhooksTriggersAndPollers = ToCommand<'add-webhooks-triggers-and-pollers'>;
        type RemoveTriggersAndPollers = ToCommand<'remove-triggers-and-pollers'>;
        type DisplayWorkflowActivation = ToCommand<'display-workflow-activation'>;
        type DisplayWorkflowDeactivation = ToCommand<'display-workflow-deactivation'>;
        type DisplayWorkflowActivationError = ToCommand<'display-workflow-activation-error'>;
        type DisplayWorkflowPublicationStatus = ToCommand<'display-workflow-publication-status'>;
        type WorkflowPublishWakeUp = ToCommand<'workflow-publish-wake-up'>;
        type RelayExecutionLifecycleEvent = ToCommand<'relay-execution-lifecycle-event'>;
        type RelayAgentExecutionUpdate = ToCommand<'relay-agent-execution-update'>;
        type RelayAgentQueuedChat = ToCommand<'relay-agent-queued-chat'>;
        type CancelAgentChatExecution = ToCommand<'cancel-agent-chat-execution'>;
        type RelayAgentMessageQueueUpdate = ToCommand<'relay-agent-message-queue-update'>;
        type RelayAgentBackgroundJobsUpdate = ToCommand<'relay-agent-background-tasks-update'>;
        type RelayAgentUpdate = ToCommand<'relay-agent-update'>;
        type ResumeAgentWorkflowTool = ToCommand<'resume-agent-workflow-tool'>;
        type CancelAgentBackgroundJob = ToCommand<'cancel-agent-background-job'>;
        type WakeAgentBackgroundJob = ToCommand<'wake-agent-background-job'>;
        type RelayChatStreamEvent = ToCommand<'relay-chat-stream-event'>;
        type RelayInstanceAiEvent = ToCommand<'relay-instance-ai-event'>;
        type RelayInstanceAiTaskControl = ToCommand<'relay-instance-ai-task-control'>;
        type RelayChatHumanMessage = ToCommand<'relay-chat-human-message'>;
        type RelayChatMessageEdit = ToCommand<'relay-chat-message-edit'>;
        type ClearTestWebhooks = ToCommand<'clear-test-webhooks'>;
        type ReloadSsoProvisioningConfiguration = ToCommand<'reload-sso-provisioning-configuration'>;
        type ReloadSourceControlConfiguration = ToCommand<'reload-source-control-config'>;
        type ReloadMcpRegistry = ToCommand<'reload-mcp-registry'>;
        type ReloadOtelConfig = ToCommand<'reload-otel-config'>;
        type ReloadInstanceAiSettings = ToCommand<'reload-instance-ai-settings'>;
        type ReloadAgentsSettings = ToCommand<'reload-agents-settings'>;
        type CancelTestRun = ToCommand<'cancel-test-run'>;
        type CancelCollection = ToCommand<'cancel-collection'>;
        type AgentChatIntegrationChanged = ToCommand<'agent-chat-integration-changed'>;
        type AgentChatSubscriptionChanged = ToCommand<'agent-chat-subscription-changed'>;
        type AgentChatLeaderChannelRequest = ToCommand<'agent-chat-leader-channel-request'>;
        type AgentChatLeaderChannelResult = ToCommand<'agent-chat-leader-channel-result'>;
        type AgentConfigChanged = ToCommand<'agent-config-changed'>;
        type AgentTasksChanged = ToCommand<'agent-tasks-changed'>;
        type RedactionFloorChanged = ToCommand<'redaction-floor-changed'>;
        type ReloadTypeAvailabilityPolicies = ToCommand<'reload-type-availability-policies'>;
    }
    export type Command = Commands.ReloadLicense | Commands.RestartEventBus | Commands.ReloadExternalSecretsProviders | Commands.CommunityPackageInstall | Commands.CommunityPackageUpdate | Commands.CommunityPackageUninstall | Commands.GetWorkerId | Commands.GetWorkerStatus | Commands.StopExecution | Commands.AddWebhooksTriggersAndPollers | Commands.RemoveTriggersAndPollers | Commands.DisplayWorkflowActivation | Commands.DisplayWorkflowDeactivation | Commands.DisplayWorkflowActivationError | Commands.DisplayWorkflowPublicationStatus | Commands.WorkflowPublishWakeUp | Commands.RelayExecutionLifecycleEvent | Commands.RelayAgentExecutionUpdate | Commands.RelayAgentQueuedChat | Commands.CancelAgentChatExecution | Commands.RelayAgentMessageQueueUpdate | Commands.RelayAgentBackgroundJobsUpdate | Commands.RelayAgentUpdate | Commands.ResumeAgentWorkflowTool | Commands.CancelAgentBackgroundJob | Commands.WakeAgentBackgroundJob | Commands.RelayChatStreamEvent | Commands.RelayInstanceAiEvent | Commands.RelayInstanceAiTaskControl | Commands.RelayChatHumanMessage | Commands.RelayChatMessageEdit | Commands.ClearTestWebhooks | Commands.ReloadOIDCConfiguration | Commands.ReloadSamlConfiguration | Commands.ReloadOAuthSigningKeys | Commands.ReloadCredentialsOverwrites | Commands.ReloadSsoProvisioningConfiguration | Commands.ReloadSourceControlConfiguration | Commands.ReloadMcpRegistry | Commands.ReloadOtelConfig | Commands.ReloadInstanceAiSettings | Commands.ReloadAgentsSettings | Commands.CancelTestRun | Commands.CancelCollection | Commands.AgentChatIntegrationChanged | Commands.AgentChatSubscriptionChanged | Commands.AgentChatLeaderChannelRequest | Commands.AgentChatLeaderChannelResult | Commands.AgentConfigChanged | Commands.AgentTasksChanged | Commands.RedactionFloorChanged | Commands.ReloadTypeAvailabilityPolicies;
    type _ToWorkerResponse<WorkerResponseKey extends keyof PubSubWorkerResponseMap> = {
        senderId: string;
        targets?: string[];
        response: WorkerResponseKey;
        debounce?: boolean;
    } & (PubSubWorkerResponseMap[WorkerResponseKey] extends never ? {
        payload?: never;
    } : {
        payload: PubSubWorkerResponseMap[WorkerResponseKey];
    });
    type ToWorkerResponse<WorkerResponseKey extends keyof PubSubWorkerResponseMap> = Resolve<_ToWorkerResponse<WorkerResponseKey>>;
    export type WorkerResponse = ToWorkerResponse<'response-to-get-worker-status'>;
    export {};
}
