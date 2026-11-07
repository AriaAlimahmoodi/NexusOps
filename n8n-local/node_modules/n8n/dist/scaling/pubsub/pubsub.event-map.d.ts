import type { AgentIntegrationConfig, AgentSseEvent, ChatHubMessageStatus, InstanceAiEvent, PushMessage, PushPayload, WorkerStatus, WorkflowPublicationStatusMessage } from '@n8n/api-types';
import type { IWorkflowBase, RelatedAgentRun, WorkflowActivateMode } from 'n8n-workflow';
export type PubSubCommandMap = {
    'relay-agent-queued-chat': {
        queueId: string;
        sequence: number;
        event?: AgentSseEvent | null;
    };
    'reload-license': never;
    'restart-event-bus': never;
    'reload-external-secrets-providers': never;
    'reload-overwrite-credentials': never;
    'reload-oidc-config': never;
    'reload-saml-config': never;
    'reload-sso-provisioning-configuration': never;
    'reload-oauth-signing-keys': never;
    'reload-source-control-config': never;
    'reload-mcp-registry': never;
    'reload-otel-config': never;
    'reload-instance-ai-settings': never;
    'reload-agents-settings': never;
    'community-package-install': {
        packageName: string;
        packageVersion: string;
        checksum?: string;
    };
    'community-package-update': {
        packageName: string;
        packageVersion: string;
        checksum?: string;
    };
    'community-package-uninstall': {
        packageName: string;
    };
    'get-worker-id': never;
    'get-worker-status': {
        requestingUserId: string;
    };
    'stop-execution': {
        executionId: string;
    };
    'add-webhooks-triggers-and-pollers': {
        workflowId: string;
        activeVersionId: string;
        activationMode: WorkflowActivateMode;
    };
    'remove-triggers-and-pollers': {
        workflowId: string;
    };
    'display-workflow-activation': {
        workflowId: string;
        activeVersionId: string;
    };
    'display-workflow-deactivation': {
        workflowId: string;
    };
    'workflow-publish-wake-up': never;
    'display-workflow-activation-error': {
        workflowId: string;
        errorMessage: string;
        errorDescription?: string;
        nodeId?: string;
    };
    'display-workflow-publication-status': WorkflowPublicationStatusMessage;
    'relay-execution-lifecycle-event': PushMessage & {
        pushRef: string;
        asBinary: boolean;
    };
    'relay-agent-execution-update': {
        data: PushPayload<'agentExecutionUpdated'>;
        userIds: string[];
    };
    'cancel-agent-chat-execution': {
        projectId: string;
        agentId: string;
        threadId: string;
        executionId: string;
        userId: string;
        surface?: 'preview' | 'n8n-chat' | 'system';
        productionN8nChat?: boolean;
    };
    'relay-agent-message-queue-update': {
        data: PushPayload<'agentMessageQueueUpdated'>;
        userIds: string[];
    };
    'relay-agent-background-tasks-update': {
        data: PushPayload<'agentBackgroundTasksUpdated'>;
        userIds: string[];
    };
    'relay-agent-update': {
        data: PushPayload<'agentUpdated'>;
        userIds: string[];
        excludePushRef?: string;
    };
    'resume-agent-workflow-tool': {
        agentRun: RelatedAgentRun;
        status: string;
    };
    'cancel-agent-background-job': {
        jobId: string;
    };
    'wake-agent-background-job': {
        threadId: string;
    };
    'clear-test-webhooks': {
        webhookKey: string;
        workflowEntity: IWorkflowBase;
        pushRef: string;
    };
    'relay-chat-stream-event': {
        eventType: 'execution-begin' | 'execution-end' | 'begin' | 'chunk' | 'end' | 'error';
        userId: string;
        sessionId: string;
        messageId: string;
        sequenceNumber: number;
        payload: {
            previousMessageId?: string | null;
            retryOfMessageId?: string | null;
            executionId?: number | null;
            content?: string;
            status?: ChatHubMessageStatus;
            error?: string;
        };
    };
    'relay-instance-ai-event': {
        threadId: string;
        storedEvent: {
            id?: number;
            event: InstanceAiEvent;
        };
    };
    'relay-instance-ai-task-control': {
        threadId: string;
        userId?: string;
        taskId?: string;
        action: 'correct' | 'cancel-task' | 'cancel-thread' | 'clear-thread';
        correction?: string;
    };
    'relay-chat-human-message': {
        userId: string;
        sessionId: string;
        messageId: string;
        previousMessageId: string | null;
        content: string;
        attachments: Array<{
            id: string;
            fileName: string;
            mimeType: string;
        }>;
    };
    'relay-chat-message-edit': {
        userId: string;
        sessionId: string;
        revisionOfMessageId: string;
        messageId: string;
        content: string;
        attachments: Array<{
            id: string;
            fileName: string;
            mimeType: string;
        }>;
    };
    'cancel-test-run': {
        testRunId: string;
    };
    'cancel-collection': {
        collectionId: string;
    };
    'agent-chat-integration-changed': {
        agentId: string;
        integration: AgentIntegrationConfig;
        action: 'connect' | 'disconnect';
    };
    'agent-chat-leader-channel-request': {
        requestId: string;
        replyTo: string;
        agentId: string;
    } & ({
        action: 'connect';
        integration: AgentIntegrationConfig;
    } | {
        action: 'disconnect';
        integration: {
            type: string;
            credentialId: string;
        };
    });
    'agent-chat-leader-channel-result': {
        requestId: string;
        ok: boolean;
        error?: string;
    };
    'agent-chat-subscription-changed': {
        agentId: string;
        integration: AgentIntegrationConfig;
        threadId: string;
        action: 'subscribe' | 'unsubscribe';
    };
    'agent-config-changed': {
        agentId: string;
    };
    'agent-tasks-changed': {
        agentId: string;
    };
    'redaction-floor-changed': never;
    'reload-type-availability-policies': never;
};
export type PubSubWorkerResponseMap = {
    'response-to-get-worker-status': WorkerStatus & {
        requestingUserId: string;
    };
};
export type PubSubLocalEventMap = {
    'pubsub-reconnected': never;
};
export type PubSubEventMap = PubSubCommandMap & PubSubWorkerResponseMap & PubSubLocalEventMap;
