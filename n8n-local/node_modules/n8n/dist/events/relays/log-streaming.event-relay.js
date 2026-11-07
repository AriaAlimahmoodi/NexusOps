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
exports.LogStreamingEventRelay = void 0;
const backend_services_1 = require("@n8n/backend-services");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const event_message_generic_1 = require("../../eventbus/event-message-classes/event-message-generic");
const message_event_bus_1 = require("../../eventbus/message-event-bus/message-event-bus");
const event_relay_1 = require("../../events/relays/event-relay");
const utils_1 = require("../../utils");
function hasUser(event) {
    return event.user !== undefined;
}
function withoutExecutionMetadata(event) {
    const trimmed = { ...event };
    delete trimmed.source;
    delete trimmed.telemetryMetadata;
    return trimmed;
}
function rulesToJson(rules) {
    return rules.map((rule) => ({
        id: rule.id,
        action: rule.action,
        selector: { ...rule.selector },
    }));
}
function policyContentToJson(content) {
    return { rules: rulesToJson(content.rules), version: content.version };
}
function attachmentsContentToJson(content) {
    return {
        attachments: content.attachments.map((attachment) => ({
            policyId: attachment.policyId,
            priority: attachment.priority,
            isFloor: attachment.isFloor,
            rules: rulesToJson(attachment.rules),
        })),
        version: content.version,
    };
}
let LogStreamingEventRelay = class LogStreamingEventRelay extends event_relay_1.EventRelay {
    constructor(eventService, eventBus, instanceSettings, userRepository) {
        super(eventService);
        this.eventService = eventService;
        this.eventBus = eventBus;
        this.instanceSettings = instanceSettings;
        this.userRepository = userRepository;
    }
    init() {
        this.setupListeners({
            'n8n-package-imported': (event) => this.packageImported(event),
            'n8n-package-exported': (event) => this.packageExported(event),
            'n8n-package-export-failed': (event) => this.packageExportFailed(event),
            'n8n-package-import-failed': (event) => this.packageImportFailed(event),
            'workflow-created': (event) => this.workflowCreated(event),
            'workflow-deleted': (event) => this.workflowDeleted(event),
            'workflow-archived': (event) => this.workflowArchived(event),
            'workflow-unarchived': (event) => this.workflowUnarchived(event),
            'workflow-activated': (event) => this.workflowActivated(event),
            'workflow-deactivated': (event) => this.workflowDeactivated(event),
            'workflow-saved': (event) => this.workflowSaved(event),
            'workflow-version-updated': (event) => this.workflowVersionUpdated(event),
            'workflow-pre-execute': (event) => this.workflowPreExecute(event),
            'workflow-post-execute': (event) => this.workflowPostExecute(event),
            'workflow-executed': (event) => this.workflowExecuted(event),
            'node-pre-execute': (event) => this.nodePreExecute(event),
            'node-post-execute': (event) => this.nodePostExecute(event),
            'user-deleted': (event) => this.userDeleted(event),
            'user-invited': (event) => this.userInvited(event),
            'user-reinvited': (event) => this.userReinvited(event),
            'user-updated': (event) => this.userUpdated(event),
            'user-mfa-enabled': (event) => this.userMfaEnabled(event),
            'user-mfa-disabled': (event) => this.userMfaDisabled(event),
            'user-signed-up': (event) => this.userSignedUp(event),
            'user-logged-in': (event) => this.userLoggedIn(event),
            'user-login-failed': (event) => this.userLoginFailed(event),
            'user-invite-email-click': (event) => this.userInviteEmailClick(event),
            'user-password-reset-email-click': (event) => this.userPasswordResetEmailClick(event),
            'user-password-reset-request-click': (event) => this.userPasswordResetRequestClick(event),
            'public-api-key-created': (event) => this.publicApiKeyCreated(event),
            'public-api-key-deleted': (event) => this.publicApiKeyDeleted(event),
            'public-api-key-rotated': (event) => this.publicApiKeyRotated(event),
            'email-failed': (event) => this.emailFailed(event),
            'credentials-created': (event) => this.credentialsCreated(event),
            'credentials-deleted': (event) => this.credentialsDeleted(event),
            'credentials-user-disconnected': (event) => this.credentialsUserDisconnected(event),
            'credentials-shared': (event) => this.credentialsShared(event),
            'credentials-updated': (event) => this.credentialsUpdated(event),
            'oauth-callback-binding-rejected': (event) => this.oauthCallbackBindingRejected(event),
            'dynamic-credential-authorize-rejected': (event) => this.dynamicCredentialAuthorizeRejected(event),
            'variable-created': (event) => this.variableCreated(event),
            'variable-updated': (event) => this.variableUpdated(event),
            'variable-deleted': (event) => this.variableDeleted(event),
            'node-type-policy-scope-updated': (event) => this.nodeTypePolicyScopeUpdated(event),
            'node-type-policy-document-created': (event) => this.nodeTypePolicyDocumentCreated(event),
            'node-type-policy-document-updated': (event) => this.nodeTypePolicyDocumentUpdated(event),
            'node-type-policy-document-deleted': (event) => this.nodeTypePolicyDocumentDeleted(event),
            'node-type-policy-attachments-updated': (event) => this.nodeTypePolicyAttachmentsUpdated(event),
            'policy-decision-blocked': (event) => this.policyDecisionBlocked(event),
            'external-secrets-provider-settings-saved': (event) => this.externalSecretsProviderSettingsSaved(event),
            'external-secrets-provider-reloaded': (event) => this.externalSecretsProviderReloaded(event),
            'external-secrets-connection-created': (event) => this.externalSecretsConnectionCreated(event),
            'external-secrets-connection-updated': (event) => this.externalSecretsConnectionUpdated(event),
            'external-secrets-connection-deleted': (event) => this.externalSecretsConnectionDeleted(event),
            'external-secrets-connection-tested': (event) => this.externalSecretsConnectionTested(event),
            'external-secrets-connection-reloaded': (event) => this.externalSecretsConnectionReloaded(event),
            'community-package-installed': (event) => this.communityPackageInstalled(event),
            'community-package-updated': (event) => this.communityPackageUpdated(event),
            'community-package-deleted': (event) => this.communityPackageDeleted(event),
            'execution-throttled': (event) => this.executionThrottled(event),
            'execution-started-during-bootup': (event) => this.executionStartedDuringBootup(event),
            'execution-cancelled': (event) => this.executionCancelled(event),
            'execution-deleted': (event) => this.executionDeleted(event),
            'execution-waiting': (event) => this.executionWaiting(event),
            'execution-resumed': (event) => this.executionResumed(event),
            'execution-data-revealed': (event) => this.executionDataRevealed(event),
            'execution-data-reveal-failure': (event) => this.executionDataRevealFailure(event),
            'ai-messages-retrieved-from-memory': (event) => this.aiMessagesRetrievedFromMemory(event),
            'ai-message-added-to-memory': (event) => this.aiMessageAddedToMemory(event),
            'ai-output-parsed': (event) => this.aiOutputParsed(event),
            'ai-documents-retrieved': (event) => this.aiDocumentsRetrieved(event),
            'ai-document-embedded': (event) => this.aiDocumentEmbedded(event),
            'ai-query-embedded': (event) => this.aiQueryEmbedded(event),
            'ai-document-processed': (event) => this.aiDocumentProcessed(event),
            'ai-text-split': (event) => this.aiTextSplitIntoChunks(event),
            'ai-tool-called': (event) => this.aiToolCalled(event),
            'ai-vector-store-searched': (event) => this.aiVectorStoreSearched(event),
            'ai-llm-generated-output': (event) => this.aiLlmGeneratedOutput(event),
            'ai-llm-errored': (event) => this.aiLlmErrored(event),
            'ai-vector-store-populated': (event) => this.aiVectorStorePopulated(event),
            'ai-vector-store-updated': (event) => this.aiVectorStoreUpdated(event),
            'runner-task-requested': (event) => this.runnerTaskRequested(event),
            'runner-response-received': (event) => this.runnerResponseReceived(event),
            'job-enqueued': (event) => this.jobEnqueued(event),
            'job-dequeued': (event) => this.jobDequeued(event),
            'job-stalled': (event) => this.jobStalled(event),
            'instance-policies-updated': (event) => this.instancePoliciesUpdated(event),
            'redaction-enforcement-updated': (event) => this.redactionEnforcementUpdated(event),
            'workflow-review-requested': (event) => this.workflowReviewRequested(event),
            'workflow-review-version-updated': (event) => this.workflowReviewVersionUpdated(event),
            'workflow-review-decided': (event) => this.workflowReviewDecided(event),
            'workflow-review-closed': (event) => this.workflowReviewClosed(event),
            'token-exchange-succeeded': (event) => this.tokenExchangeSucceeded(event),
            'token-exchange-failed': (event) => this.tokenExchangeFailed(event),
            'token-exchange-identity-linked': (event) => this.tokenExchangeIdentityLinked(event),
            'token-exchange-identity-rebound': (event) => this.tokenExchangeIdentityRebound(event),
            'token-exchange-user-provisioned': (event) => this.tokenExchangeUserProvisioned(event),
            'token-exchange-role-updated': (event) => this.tokenExchangeRoleUpdated(event),
            'embed-login': (event) => this.embedLogin(event),
            'embed-login-failed': (event) => this.embedLoginFailed(event),
            'expression-mapping-roles-resolved': (event) => this.expressionMappingRolesResolved(event),
            'role-mapping-rule-created': (event) => this.roleMappingRuleCreated(event),
            'role-mapping-rule-updated': (event) => this.roleMappingRuleUpdated(event),
            'role-mapping-rule-deleted': (event) => this.roleMappingRuleDeleted(event),
            'role-mapping-rules-bulk-deleted': (event) => this.roleMappingRulesBulkDeleted(event),
            'trusted-source-created': (event) => this.trustedSourceCreated(event),
            'trusted-source-updated': (event) => this.trustedSourceUpdated(event),
            'trusted-source-deleted': (event) => this.trustedSourceDeleted(event),
            'mcp-oauth-completed': (event) => this.mcpOauthCompleted(event),
            'mcp-tool-called': (event) => this.mcpToolCalled(event),
            'mcp-access-updated': (event) => this.mcpAccessUpdated(event),
            'instance-report-delivered': () => this.instanceReportDelivered(),
            'instance-report-failed': () => this.instanceReportFailed(),
        });
    }
    packageImported({ user, counts, ...rest }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.n8n-package.import.success',
            payload: { ...user, ...rest },
        });
    }
    packageExported({ user, counts, credentialExportPolicy, includeArchivedWorkflows, ...rest }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.n8n-package.export.success',
            payload: { ...user, ...rest },
        });
    }
    packageExportFailed({ user, ...rest }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.n8n-package.export.failed',
            payload: { ...user, operation: 'export', ...rest },
        });
    }
    instanceReportDelivered() {
        void this.eventBus.send(new event_message_generic_1.EventMessageGeneric({ eventName: 'n8n.instanceReporting.success' }));
    }
    instanceReportFailed() {
        void this.eventBus.send(new event_message_generic_1.EventMessageGeneric({ eventName: 'n8n.instanceReporting.failed' }));
    }
    packageImportFailed({ user, ...rest }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.n8n-package.import.failed',
            payload: { ...user, operation: 'import', ...rest },
        });
    }
    workflowCreated({ user, workflow }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.workflow.created',
            payload: {
                ...user,
                workflowId: workflow.id,
                workflowName: workflow.name,
            },
        });
    }
    workflowDeleted({ user, workflowId }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.workflow.deleted',
            payload: { ...user, workflowId },
        });
    }
    workflowArchived({ user, workflowId }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.workflow.archived',
            payload: { ...user, workflowId },
        });
    }
    workflowUnarchived({ user, workflowId }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.workflow.unarchived',
            payload: { ...user, workflowId },
        });
    }
    workflowActivated({ user, workflowId, workflow }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.workflow.activated',
            payload: {
                ...user,
                workflowId,
                workflowName: workflow.name,
                activeVersionId: workflow.activeVersionId,
            },
        });
    }
    workflowDeactivated({ user, workflowId, workflow, deactivatedVersionId, }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.workflow.deactivated',
            payload: {
                ...user,
                workflowId,
                workflowName: workflow.name,
                deactivatedVersionId,
            },
        });
    }
    workflowSaved({ user, workflow, settingsChanged }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.workflow.updated',
            payload: {
                ...user,
                workflowId: workflow.id,
                workflowName: workflow.name,
                ...(settingsChanged && { settingsChanged }),
            },
        });
    }
    workflowVersionUpdated({ user, workflowId, workflowName, versionId, versionName, versionDescription, }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.workflow.version.updated',
            payload: {
                ...user,
                workflowId,
                workflowName,
                versionId,
                ...(versionName !== undefined && { versionName }),
                ...(versionDescription !== undefined && { versionDescription }),
            },
        });
    }
    workflowPreExecute({ data, executionId, mode, projectId, projectName, }) {
        const payload = 'executionData' in data
            ? {
                executionId,
                userId: data.userId,
                workflowId: data.workflowData.id,
                isManual: data.executionMode === 'manual',
                mode,
                workflowName: data.workflowData.name,
                projectId: data.projectId ?? projectId,
                projectName: data.projectName ?? projectName,
            }
            : {
                executionId,
                userId: undefined,
                workflowId: data.id,
                isManual: false,
                mode,
                workflowName: data.name,
                projectId,
                projectName,
            };
        void this.eventBus.sendWorkflowEvent({
            eventName: 'n8n.workflow.started',
            payload,
        });
    }
    workflowPostExecute(event) {
        const { runData, workflow, executionId, projectId, projectName, ...rest } = withoutExecutionMetadata(event);
        const payload = {
            ...rest,
            executionId,
            success: !!runData?.finished,
            isManual: runData?.mode === 'manual',
            mode: runData?.mode,
            workflowId: workflow.id,
            workflowName: workflow.name,
            projectId,
            projectName,
        };
        if (payload.success) {
            void this.eventBus.sendWorkflowEvent({
                eventName: 'n8n.workflow.success',
                payload,
            });
            if (runData?.jobId) {
                void this.eventBus.sendQueueEvent({
                    eventName: 'n8n.queue.job.completed',
                    payload: {
                        executionId,
                        workflowId: workflow.id,
                        hostId: this.instanceSettings.hostId,
                        jobId: runData.jobId.toString(),
                    },
                });
            }
            return;
        }
        void this.eventBus.sendWorkflowEvent({
            eventName: 'n8n.workflow.failed',
            payload: {
                ...payload,
                lastNodeExecuted: runData?.data.resultData.lastNodeExecuted,
                errorNodeType: runData?.data.resultData.error && 'node' in runData?.data.resultData.error
                    ? runData?.data.resultData.error.node?.type
                    : undefined,
                errorMessage: runData?.data.resultData.error?.message.toString(),
            },
        });
        if (runData?.jobId) {
            void this.eventBus.sendQueueEvent({
                eventName: 'n8n.queue.job.failed',
                payload: {
                    executionId,
                    workflowId: workflow.id,
                    hostId: this.instanceSettings.hostId,
                    jobId: runData.jobId.toString(),
                },
            });
        }
    }
    workflowExecutedWithUser({ user, workflowId, workflowName, executionId, projectId, projectName, source, }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.workflow.executed',
            payload: {
                ...user,
                workflowId,
                workflowName,
                executionId,
                projectId,
                projectName,
                source,
            },
        });
    }
    workflowExecutedWithoutUser({ workflowId, workflowName, executionId, projectId, projectName, source, }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.workflow.executed',
            payload: {
                workflowId,
                workflowName,
                executionId,
                projectId,
                projectName,
                source,
            },
        });
    }
    workflowExecuted(event) {
        if (hasUser(event)) {
            this.workflowExecutedWithUser(event);
        }
        else {
            this.workflowExecutedWithoutUser(event);
        }
    }
    nodePreExecute({ workflow, executionId, nodeId, nodeName, nodeType, }) {
        void this.eventBus.sendNodeEvent({
            eventName: 'n8n.node.started',
            payload: {
                workflowId: workflow.id,
                workflowName: workflow.name,
                executionId,
                nodeType,
                nodeName,
                nodeId,
            },
        });
    }
    nodePostExecute({ workflow, executionId, nodeType, nodeName, nodeId, }) {
        void this.eventBus.sendNodeEvent({
            eventName: 'n8n.node.finished',
            payload: {
                workflowId: workflow.id,
                workflowName: workflow.name,
                executionId,
                nodeType,
                nodeName,
                nodeId,
            },
        });
    }
    userDeleted({ user }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.user.deleted',
            payload: user,
        });
    }
    userInvited({ user, targetUserId }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.user.invited',
            payload: { ...user, targetUserId },
        });
    }
    userReinvited({ user, targetUserId }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.user.reinvited',
            payload: { ...user, targetUserId },
        });
    }
    userUpdated({ user, fieldsChanged }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.user.updated',
            payload: { ...user, fieldsChanged },
        });
    }
    userMfaEnabled({ user }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.user.mfa.enabled',
            payload: user,
        });
    }
    userMfaDisabled({ user, disableMethod }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.user.mfa.disabled',
            payload: { ...user, disableMethod },
        });
    }
    userSignedUp({ user }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.user.signedup',
            payload: user,
        });
    }
    userLoggedIn({ user, authenticationMethod }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.user.login.success',
            payload: { ...user, authenticationMethod },
        });
    }
    userLoginFailed(event) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.user.login.failed',
            payload: event,
        });
    }
    userInviteEmailClick(event) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.user.invitation.accepted',
            payload: event,
        });
    }
    userPasswordResetEmailClick({ user }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.user.reset',
            payload: user,
        });
    }
    userPasswordResetRequestClick({ user, }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.user.reset.requested',
            payload: user,
        });
    }
    publicApiKeyCreated({ user }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.user.api.created',
            payload: user,
        });
    }
    publicApiKeyDeleted({ user, isOwn }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.user.api.deleted',
            payload: { ...user, is_own: isOwn },
        });
    }
    publicApiKeyRotated({ user }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.user.api.rotated',
            payload: user,
        });
    }
    emailFailed({ user, messageType }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.user.email.failed',
            payload: { ...user, messageType },
        });
    }
    credentialsCreated({ user, credentialType, credentialId, publicApi, projectId, projectType, isDynamic, usesExternalSecrets, jweEnabled, supportsManagedAuth, usesManagedAuth, }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.user.credentials.created',
            payload: {
                ...user,
                credentialType,
                credentialId,
                publicApi,
                projectId,
                projectType,
                isDynamic,
                usesExternalSecrets,
                jweEnabled,
                supportsManagedAuth,
                usesManagedAuth,
            },
        });
    }
    credentialsDeleted({ user, credentialType, credentialId, }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.user.credentials.deleted',
            payload: { ...user, credentialType, credentialId },
        });
    }
    credentialsUserDisconnected({ user, ...rest }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.user.credentials.userDisconnected',
            payload: { ...user, ...rest },
        });
    }
    credentialsShared({ user, ...rest }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.user.credentials.shared',
            payload: { ...user, ...rest },
        });
    }
    credentialsUpdated({ user, credentialType, credentialId, isDynamic, usesExternalSecrets, jweEnabled, supportsManagedAuth, usesManagedAuth, }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.user.credentials.updated',
            payload: {
                ...user,
                credentialType,
                credentialId,
                isDynamic,
                usesExternalSecrets,
                jweEnabled,
                supportsManagedAuth,
                usesManagedAuth,
            },
        });
    }
    oauthCallbackBindingRejected(event) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.oauth.callback.binding.rejected',
            payload: event,
        });
    }
    dynamicCredentialAuthorizeRejected(event) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.credentials.authorize.rejected',
            payload: event,
        });
    }
    variableCreated({ user, ...rest }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.variable.created',
            payload: { ...user, ...rest },
        });
    }
    variableUpdated({ user, ...rest }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.variable.updated',
            payload: { ...user, ...rest },
        });
    }
    variableDeleted({ user, ...rest }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.variable.deleted',
            payload: { ...user, ...rest },
        });
    }
    nodeTypePolicyScopeUpdated(event) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.node-type-policy.scope.updated',
            payload: {
                updatedBy: event.updatedBy,
                kind: event.kind,
                projectId: event.projectId,
                scopeId: event.scopeId,
                before: event.before ? { ...event.before } : null,
                after: { ...event.after },
            },
        });
    }
    nodeTypePolicyDocumentCreated(event) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.node-type-policy.document.created',
            payload: {
                updatedBy: event.updatedBy,
                kind: event.kind,
                policyId: event.policyId,
                after: policyContentToJson(event.after),
            },
        });
    }
    nodeTypePolicyDocumentUpdated(event) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.node-type-policy.document.updated',
            payload: {
                updatedBy: event.updatedBy,
                kind: event.kind,
                policyId: event.policyId,
                before: policyContentToJson(event.before),
                after: policyContentToJson(event.after),
            },
        });
    }
    nodeTypePolicyDocumentDeleted(event) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.node-type-policy.document.deleted',
            payload: {
                updatedBy: event.updatedBy,
                kind: event.kind,
                policyId: event.policyId,
                before: policyContentToJson(event.before),
            },
        });
    }
    nodeTypePolicyAttachmentsUpdated(event) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.node-type-policy.attachments.updated',
            payload: {
                updatedBy: event.updatedBy,
                kind: event.kind,
                projectId: event.projectId,
                scopeId: event.scopeId,
                before: attachmentsContentToJson(event.before),
                after: attachmentsContentToJson(event.after),
            },
        });
    }
    policyDecisionBlocked(event) {
        if (event.actorType === 'system' && event.systemReason === 'log-streaming')
            return;
        if (event.actorType === 'system' || event.user.email !== undefined) {
            this.sendPolicyDecisionBlocked(event);
            return;
        }
        void this.findAuditedUser(event.user).then((user) => this.sendPolicyDecisionBlocked({ ...event, user }));
    }
    async findAuditedUser(user) {
        try {
            return (await this.userRepository.findByIdWithRole(user.id)) ?? user;
        }
        catch {
            return user;
        }
    }
    sendPolicyDecisionBlocked({ user, policyVersions, ...rest }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.policy.decision.blocked',
            payload: {
                ...(user ?? { userId: null }),
                ...rest,
                policyVersions: policyVersions?.map((version) => ({ ...version })) ?? [],
            },
        });
    }
    externalSecretsProviderSettingsSaved(payload) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.external-secrets.provider.settings.saved',
            payload,
        });
    }
    externalSecretsProviderReloaded(payload) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.external-secrets.provider.reloaded',
            payload,
        });
    }
    externalSecretsConnectionCreated(payload) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.external-secrets.connection.created',
            payload,
        });
    }
    externalSecretsConnectionUpdated(payload) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.external-secrets.connection.updated',
            payload,
        });
    }
    externalSecretsConnectionDeleted(payload) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.external-secrets.connection.deleted',
            payload,
        });
    }
    externalSecretsConnectionTested(payload) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.external-secrets.connection.tested',
            payload,
        });
    }
    externalSecretsConnectionReloaded(payload) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.external-secrets.connection.reloaded',
            payload,
        });
    }
    communityPackageInstalled({ user, ...rest }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.package.installed',
            payload: { ...user, ...rest },
        });
    }
    communityPackageUpdated({ user, ...rest }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.package.updated',
            payload: { ...user, ...rest },
        });
    }
    communityPackageDeleted({ user, ...rest }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.package.deleted',
            payload: { ...user, ...rest },
        });
    }
    executionThrottled({ executionId, type }) {
        void this.eventBus.sendExecutionEvent({
            eventName: 'n8n.execution.throttled',
            payload: { executionId, type },
        });
    }
    executionStartedDuringBootup({ executionId, }) {
        void this.eventBus.sendExecutionEvent({
            eventName: 'n8n.execution.started-during-bootup',
            payload: { executionId },
        });
    }
    executionCancelled({ executionId, workflowId, workflowName, reason, }) {
        void this.eventBus.sendWorkflowEvent({
            eventName: 'n8n.workflow.cancelled',
            payload: {
                executionId,
                workflowId,
                workflowName,
                reason,
            },
        });
    }
    executionDeleted({ user, executionIds, deleteBefore, }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.user.execution.deleted',
            payload: {
                ...user,
                executionIds,
                ...(deleteBefore && { deleteBefore: deleteBefore.toISOString() }),
            },
        });
    }
    executionWaiting({ executionId, workflowId }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.workflow.waiting',
            payload: {
                executionId,
                workflowId,
            },
        });
    }
    executionResumed({ executionId, workflowId, resumeSource, responseAt, }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.workflow.resumed',
            payload: {
                executionId,
                workflowId,
                resumeSource,
                responseAt: responseAt.toISOString(),
            },
        });
    }
    executionDataRevealed({ user, executionId, workflowId, ipAddress, userAgent, redactionPolicy, }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.execution.data.revealed',
            payload: { ...user, executionId, workflowId, ipAddress, userAgent, redactionPolicy },
        });
    }
    executionDataRevealFailure({ user, executionId, workflowId, ipAddress, userAgent, redactionPolicy, rejectionReason, }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.execution.data.reveal_failure',
            payload: {
                ...user,
                executionId,
                workflowId,
                ipAddress,
                userAgent,
                redactionPolicy,
                rejectionReason,
            },
        });
    }
    aiMessagesRetrievedFromMemory(payload) {
        void this.eventBus.sendAiNodeEvent({
            eventName: 'n8n.ai.memory.get.messages',
            payload,
        });
    }
    aiMessageAddedToMemory(payload) {
        void this.eventBus.sendAiNodeEvent({
            eventName: 'n8n.ai.memory.added.message',
            payload,
        });
    }
    aiOutputParsed(payload) {
        void this.eventBus.sendAiNodeEvent({
            eventName: 'n8n.ai.output.parser.parsed',
            payload,
        });
    }
    aiDocumentsRetrieved(payload) {
        void this.eventBus.sendAiNodeEvent({
            eventName: 'n8n.ai.retriever.get.relevant.documents',
            payload,
        });
    }
    aiDocumentEmbedded(payload) {
        void this.eventBus.sendAiNodeEvent({
            eventName: 'n8n.ai.embeddings.embedded.document',
            payload,
        });
    }
    aiQueryEmbedded(payload) {
        void this.eventBus.sendAiNodeEvent({
            eventName: 'n8n.ai.embeddings.embedded.query',
            payload,
        });
    }
    aiDocumentProcessed(payload) {
        void this.eventBus.sendAiNodeEvent({
            eventName: 'n8n.ai.document.processed',
            payload,
        });
    }
    aiTextSplitIntoChunks(payload) {
        void this.eventBus.sendAiNodeEvent({
            eventName: 'n8n.ai.text.splitter.split',
            payload,
        });
    }
    aiToolCalled(payload) {
        void this.eventBus.sendAiNodeEvent({
            eventName: 'n8n.ai.tool.called',
            payload,
        });
    }
    aiVectorStoreSearched(payload) {
        void this.eventBus.sendAiNodeEvent({
            eventName: 'n8n.ai.vector.store.searched',
            payload,
        });
    }
    aiLlmGeneratedOutput(payload) {
        void this.eventBus.sendAiNodeEvent({
            eventName: 'n8n.ai.llm.generated',
            payload,
        });
    }
    aiLlmErrored(payload) {
        void this.eventBus.sendAiNodeEvent({
            eventName: 'n8n.ai.llm.error',
            payload,
        });
    }
    aiVectorStorePopulated(payload) {
        void this.eventBus.sendAiNodeEvent({
            eventName: 'n8n.ai.vector.store.populated',
            payload,
        });
    }
    aiVectorStoreUpdated(payload) {
        void this.eventBus.sendAiNodeEvent({
            eventName: 'n8n.ai.vector.store.updated',
            payload,
        });
    }
    runnerTaskRequested(payload) {
        void this.eventBus.sendRunnerEvent({
            eventName: 'n8n.runner.task.requested',
            payload,
        });
    }
    runnerResponseReceived(payload) {
        void this.eventBus.sendRunnerEvent({
            eventName: 'n8n.runner.response.received',
            payload,
        });
    }
    jobEnqueued(payload) {
        void this.eventBus.sendQueueEvent({
            eventName: 'n8n.queue.job.enqueued',
            payload,
        });
    }
    jobDequeued(payload) {
        void this.eventBus.sendQueueEvent({
            eventName: 'n8n.queue.job.dequeued',
            payload,
        });
    }
    jobStalled(payload) {
        void this.eventBus.sendQueueEvent({
            eventName: 'n8n.queue.job.stalled',
            payload,
        });
    }
    instancePoliciesUpdated({ user, settingName, value, }) {
        switch (settingName) {
            case 'workflow_publishing':
                void this.eventBus.sendAuditEvent({
                    eventName: value
                        ? 'n8n.audit.personal-publishing-restricted.disabled'
                        : 'n8n.audit.personal-publishing-restricted.enabled',
                    payload: user,
                });
                break;
            case 'workflow_sharing':
                void this.eventBus.sendAuditEvent({
                    eventName: value
                        ? 'n8n.audit.personal-sharing-restricted.disabled'
                        : 'n8n.audit.personal-sharing-restricted.enabled',
                    payload: user,
                });
                break;
            case '2fa_enforcement':
                void this.eventBus.sendAuditEvent({
                    eventName: value
                        ? 'n8n.audit.2fa-enforcement.enabled'
                        : 'n8n.audit.2fa-enforcement.disabled',
                    payload: user,
                });
                break;
            case 'data_redaction_enforcement_floor':
                break;
            case 'workflow_reviews':
                void this.eventBus.sendAuditEvent({
                    eventName: value
                        ? 'n8n.audit.workflow-reviews.enabled'
                        : 'n8n.audit.workflow-reviews.disabled',
                    payload: user,
                });
                break;
            default:
                (0, utils_1.assertNever)(settingName);
        }
    }
    redactionEnforcementUpdated({ user, before, after, }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.redaction-enforcement.updated',
            payload: { ...user, before, after },
        });
    }
    workflowReviewRequested({ user, workflowReviewRequestId, projectId, workflowId, workflowVersionId, }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.workflow-review.requested',
            payload: {
                ...user,
                projectId,
                workflowId,
                versionId: workflowVersionId,
                workflowReviewRequestId,
            },
        });
    }
    workflowReviewVersionUpdated({ user, workflowReviewRequestId, workflowId, workflowVersionId, }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.workflow-review.version-updated',
            payload: { ...user, workflowId, versionId: workflowVersionId, workflowReviewRequestId },
        });
    }
    workflowReviewDecided({ user, workflowReviewRequestId, workflowId, workflowVersionId, decision, decidedVia, }) {
        void this.eventBus.sendAuditEvent({
            eventName: decision === 'approved'
                ? 'n8n.audit.workflow-review.approved'
                : 'n8n.audit.workflow-review.changes-requested',
            payload: {
                ...user,
                workflowId,
                versionId: workflowVersionId,
                workflowReviewRequestId,
                decidedVia,
            },
        });
    }
    workflowReviewClosed({ workflowReviewRequestId, cause, }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.workflow-review.closed',
            payload: {
                workflowReviewRequestId,
                causeTrigger: cause.trigger,
                causeActorKind: cause.actorKind,
                causeUserId: cause.userId,
            },
        });
    }
    tokenExchangeSucceeded(event) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.token-exchange.succeeded',
            payload: event,
        });
    }
    tokenExchangeFailed(event) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.token-exchange.failed',
            payload: event,
        });
    }
    tokenExchangeIdentityLinked(event) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.token-exchange.identity-linked',
            payload: event,
        });
    }
    tokenExchangeIdentityRebound(event) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.token-exchange.identity-rebound',
            payload: event,
        });
    }
    tokenExchangeUserProvisioned(event) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.token-exchange.user-provisioned',
            payload: event,
        });
    }
    tokenExchangeRoleUpdated(event) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.token-exchange.role-updated',
            payload: event,
        });
    }
    embedLogin(event) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.token-exchange.embed-login',
            payload: event,
        });
    }
    embedLoginFailed(event) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.token-exchange.embed-login-failed',
            payload: event,
        });
    }
    expressionMappingRolesResolved(event) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.role-mapping.roles-resolved',
            payload: {
                userId: event.userId,
                userEmail: event.userEmail,
                msg: {
                    provider: event.provider,
                    instanceRole: event.instanceRole,
                    projectRoles: event.projectRoles,
                    removedProjectIds: event.removedProjectIds,
                },
            },
        });
    }
    roleMappingRuleCreated(event) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.role-mapping.rule.created',
            payload: {
                ...event.user,
                msg: {
                    ruleId: event.ruleId,
                    ruleType: event.ruleType,
                    expression: event.expression,
                    role: event.role,
                },
            },
        });
    }
    roleMappingRuleUpdated(event) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.role-mapping.rule.updated',
            payload: {
                ...event.user,
                msg: {
                    ruleId: event.ruleId,
                    ruleType: event.ruleType,
                    patchedFields: event.patchedFields,
                },
            },
        });
    }
    roleMappingRuleDeleted(event) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.role-mapping.rule.deleted',
            payload: {
                ...event.user,
                msg: {
                    ruleId: event.ruleId,
                    ruleType: event.ruleType,
                },
            },
        });
    }
    roleMappingRulesBulkDeleted(event) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.role-mapping.rules.bulk-deleted',
            payload: {
                msg: {
                    ruleType: event.ruleType,
                    count: event.count,
                    reason: event.reason,
                },
            },
        });
    }
    trustedSourceCreated({ user, ...rest }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.trusted-source.created',
            payload: { ...user, ...rest },
        });
    }
    trustedSourceUpdated({ user, ...rest }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.trusted-source.updated',
            payload: { ...user, ...rest },
        });
    }
    trustedSourceDeleted({ user, ...rest }) {
        void this.eventBus.sendAuditEvent({
            eventName: 'n8n.audit.trusted-source.deleted',
            payload: { ...user, ...rest },
        });
    }
    mcpOauthCompleted({ userId, clientId, clientName, }) {
        void this.eventBus.sendMcpEvent({
            eventName: 'n8n.audit.mcp.oauth.completed',
            payload: { userId, clientId, clientName },
        });
    }
    mcpToolCalled({ user, ...rest }) {
        void this.eventBus.sendMcpEvent({
            eventName: 'n8n.audit.mcp.tool.called',
            payload: { ...user, ...rest },
        });
    }
    mcpAccessUpdated({ user, ...rest }) {
        void this.eventBus.sendMcpEvent({
            eventName: 'n8n.audit.mcp.access.updated',
            payload: { ...user, ...rest },
        });
    }
};
exports.LogStreamingEventRelay = LogStreamingEventRelay;
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "packageImported", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "packageExported", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "packageExportFailed", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "packageImportFailed", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "workflowCreated", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "workflowDeleted", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "workflowArchived", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "workflowUnarchived", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "workflowActivated", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "workflowDeactivated", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "workflowSaved", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "workflowVersionUpdated", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "workflowExecutedWithUser", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "userDeleted", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "userInvited", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "userReinvited", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "userUpdated", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "userMfaEnabled", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "userMfaDisabled", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "userSignedUp", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "userLoggedIn", null);
__decorate([
    (0, decorators_1.Redactable)('inviter'),
    (0, decorators_1.Redactable)('invitee'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "userInviteEmailClick", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "userPasswordResetEmailClick", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "userPasswordResetRequestClick", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "publicApiKeyCreated", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "publicApiKeyDeleted", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "publicApiKeyRotated", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "emailFailed", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "credentialsCreated", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "credentialsDeleted", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "credentialsUserDisconnected", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "credentialsShared", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "credentialsUpdated", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "variableCreated", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "variableUpdated", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "variableDeleted", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "sendPolicyDecisionBlocked", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "communityPackageInstalled", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "communityPackageUpdated", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "communityPackageDeleted", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "executionDeleted", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "executionDataRevealed", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "executionDataRevealFailure", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "instancePoliciesUpdated", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "redactionEnforcementUpdated", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "workflowReviewRequested", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "workflowReviewVersionUpdated", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "workflowReviewDecided", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "trustedSourceCreated", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "trustedSourceUpdated", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "trustedSourceDeleted", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "mcpToolCalled", null);
__decorate([
    (0, decorators_1.Redactable)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LogStreamingEventRelay.prototype, "mcpAccessUpdated", null);
exports.LogStreamingEventRelay = LogStreamingEventRelay = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_services_1.EventService, message_event_bus_1.MessageEventBus, n8n_core_1.InstanceSettings, db_1.UserRepository])
], LogStreamingEventRelay);
//# sourceMappingURL=log-streaming.event-relay.js.map