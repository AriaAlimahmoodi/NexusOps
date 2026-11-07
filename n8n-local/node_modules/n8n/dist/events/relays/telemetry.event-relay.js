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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelemetryEventRelay = void 0;
exports.getSemanticVersioning = getSemanticVersioning;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const permissions_1 = require("@n8n/permissions");
const telemetry_1 = require("@n8n/telemetry");
const change_case_1 = require("change-case");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const node_os_1 = __importDefault(require("node:os"));
const semver_1 = __importDefault(require("semver"));
const config_2 = __importDefault(require("../../config"));
const constants_1 = require("../../constants");
const dynamic_credentials_proxy_1 = require("../../credentials/dynamic-credentials-proxy");
const shared_hook_functions_1 = require("../../execution-lifecycle/shared/shared-hook-functions");
const license_1 = require("../../license");
const load_nodes_and_credentials_1 = require("../../load-nodes-and-credentials");
const constants_2 = require("../../modules/type-availability-policies/constants");
const package_resolver_1 = require("../../modules/type-availability-policies/package-resolver");
const policy_evaluator_1 = require("../../modules/type-availability-policies/policy-evaluator");
const node_types_1 = require("../../node-types");
const posthog_1 = require("../../posthog");
const ownership_service_1 = require("../../services/ownership.service");
const container_limits_1 = require("../../utils/container-limits");
const detect_runtime_1 = require("../../utils/detect-runtime");
const event_relay_1 = require("./event-relay");
const telemetry_2 = require("../../telemetry");
const MAX_NODE_GRAPH_STRING_SIZE = 24 * 1024;
function countWorkflowCustomTelemetryTags(workflow) {
    return workflow.settings?.customTelemetryTags?.length ?? 0;
}
function countNodesWithCustomTelemetryTags(nodes) {
    return nodes.filter((node) => (node.customTelemetryTags?.tag?.length ?? 0) > 0).length;
}
function countNodeCustomTelemetryTags(nodes) {
    return nodes.reduce((total, node) => total + (node.customTelemetryTags?.tag?.length ?? 0), 0);
}
function countPublishedEmptyGroups(workflow) {
    const publishedVersion = workflow.activeVersion;
    if (!publishedVersion?.nodeGroups || !publishedVersion.nodes)
        return 0;
    return publishedVersion.nodeGroups.filter((group) => (0, n8n_workflow_1.getEmptyGroupAnchor)(group, publishedVersion.nodes) !== undefined).length;
}
function policyActor(updatedBy) {
    return updatedBy === 'environment'
        ? { source: 'environment' }
        : { user_id: updatedBy, source: 'user' };
}
function policyScope(projectId) {
    return projectId === null ? { scope: 'instance' } : { scope: 'project', project_id: projectId };
}
function isPolicyKind(kind) {
    return telemetry_1.POLICY_KINDS.includes(kind);
}
function countRuleActions(rules) {
    return {
        rule_count: rules.length,
        allow_rule_count: rules.filter((rule) => rule.action === 'allow').length,
        deny_rule_count: rules.filter((rule) => rule.action === 'deny').length,
        delegate_rule_count: rules.filter((rule) => rule.action === 'delegate').length,
    };
}
const MAX_LISTED_POLICY_TYPES = 100;
const MAX_LISTED_VIOLATIONS = 50;
const TYPE_NAME_SUBJECT_TYPES = new Set(['nodeType', 'credentialType']);
function policedTargetType(event) {
    if (event.credentialType !== undefined)
        return 'credential';
    if (event.agentId !== undefined)
        return 'agent';
    return 'workflow';
}
function summarizeTypeAvailability(rules, defaultAction, types, resolvePackage) {
    const partition = (0, policy_evaluator_1.partitionTypesByAction)(rules, defaultAction, types, resolvePackage);
    return {
        evaluated_type_count: types.length,
        blocked_type_count: partition.deny.length,
        allowed_type_count: partition.allow.length,
        delegated_type_count: partition.delegate.length,
        blocked_types: partition.deny.slice(0, MAX_LISTED_POLICY_TYPES),
        allowed_types: partition.allow.slice(0, MAX_LISTED_POLICY_TYPES),
    };
}
function countSelectorKinds(rules) {
    return {
        name_selector_count: rules.filter((rule) => rule.selector.kind === 'name').length,
        package_selector_count: rules.filter((rule) => rule.selector.kind === 'package').length,
        extends_selector_count: rules.filter((rule) => rule.selector.kind === 'extends').length,
    };
}
function limitNodeGraphStringSize(nodeGraphString) {
    if (Buffer.byteLength(nodeGraphString, 'utf8') > MAX_NODE_GRAPH_STRING_SIZE)
        return '{}';
    return nodeGraphString;
}
function getExecutionTelemetryProperties(source, telemetryMetadata) {
    const executionSource = source ?? 'user';
    if (executionSource !== 'instance_ai')
        return { execution_source: executionSource };
    const { mockDataSources } = telemetryMetadata ?? {};
    return {
        execution_source: executionSource,
        ...(mockDataSources?.length ? { mock_data_sources: mockDataSources.join(',') } : {}),
    };
}
let TelemetryEventRelay = class TelemetryEventRelay extends event_relay_1.EventRelay {
    constructor(eventService, telemetry, license, licenseState, globalConfig, instanceSettings, binaryDataConfig, workflowRepository, nodeTypes, sharedWorkflowRepository, projectRelationRepository, credentialsRepository, dynamicCredentialsProxy, dbConnection, loadNodesAndCredentials, postHogClient, ownershipService) {
        super(eventService);
        this.eventService = eventService;
        this.telemetry = telemetry;
        this.license = license;
        this.licenseState = licenseState;
        this.globalConfig = globalConfig;
        this.instanceSettings = instanceSettings;
        this.binaryDataConfig = binaryDataConfig;
        this.workflowRepository = workflowRepository;
        this.nodeTypes = nodeTypes;
        this.sharedWorkflowRepository = sharedWorkflowRepository;
        this.projectRelationRepository = projectRelationRepository;
        this.credentialsRepository = credentialsRepository;
        this.dynamicCredentialsProxy = dynamicCredentialsProxy;
        this.dbConnection = dbConnection;
        this.loadNodesAndCredentials = loadNodesAndCredentials;
        this.postHogClient = postHogClient;
        this.ownershipService = ownershipService;
    }
    async init() {
        if (!this.globalConfig.diagnostics.enabled)
            return;
        await this.telemetry.init();
        this.setupListeners({
            'team-project-updated': (event) => this.teamProjectUpdated(event),
            'team-project-deleted': (event) => this.teamProjectDeleted(event),
            'team-project-created': (event) => this.teamProjectCreated(event),
            'source-control-settings-updated': (event) => this.sourceControlSettingsUpdated(event),
            'source-control-user-started-pull-ui': (event) => this.sourceControlUserStartedPullUi(event),
            'source-control-user-finished-pull-ui': (event) => this.sourceControlUserFinishedPullUi(event),
            'source-control-user-pulled-api': (event) => this.sourceControlUserPulledApi(event),
            'source-control-user-started-push-ui': (event) => this.sourceControlUserStartedPushUi(event),
            'source-control-user-finished-push-ui': (event) => this.sourceControlUserFinishedPushUi(event),
            'license-renewal-attempted': (event) => this.licenseRenewalAttempted(event),
            'license-community-plus-registered': (event) => this.licenseCommunityPlusRegistered(event),
            'variable-created': (event) => this.variableCreated(event),
            'variable-updated': (event) => this.variableUpdated(event),
            'variable-deleted': (event) => this.variableDeleted(event),
            'node-type-policy-saved': (event) => this.nodeTypePolicySaved(event),
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
            'external-secrets-system-roles-toggled': (event) => this.externalSecretsSystemRolesToggled(event),
            'public-api-invoked': (event) => this.publicApiInvoked(event),
            'public-api-key-created': (event) => this.publicApiKeyCreated(event),
            'public-api-key-deleted': (event) => this.publicApiKeyDeleted(event),
            'public-api-key-rotated': (event) => this.publicApiKeyRotated(event),
            'community-package-installed': (event) => this.communityPackageInstalled(event),
            'community-package-updated': (event) => this.communityPackageUpdated(event),
            'community-package-deleted': (event) => this.communityPackageDeleted(event),
            'credentials-created': (event) => this.credentialsCreated(event),
            'credentials-shared': (event) => this.credentialsShared(event),
            'credentials-updated': (event) => this.credentialsUpdated(event),
            'credentials-deleted': (event) => this.credentialsDeleted(event),
            'credentials-user-disconnected': (event) => this.credentialsUserDisconnected(event),
            'credentials-probed': (event) => this.credentialsProbed(event),
            'private-credential-created': (event) => this.privateCredentialCreated(event),
            'private-credential-toggled-to-private': (event) => this.privateCredentialToggledToPrivate(event),
            'private-credential-toggled-to-static': (event) => this.privateCredentialToggledToStatic(event),
            'private-credential-connections-cleared': (event) => this.privateCredentialConnectionsCleared(event),
            'private-credential-deleted': (event) => this.privateCredentialDeleted(event),
            'private-credential-user-connected': (event) => this.privateCredentialUserConnected(event),
            'ldap-general-sync-finished': (event) => this.ldapGeneralSyncFinished(event),
            'ldap-settings-updated': (event) => this.ldapSettingsUpdated(event),
            'ldap-login-sync-failed': (event) => this.ldapLoginSyncFailed(event),
            'login-failed-due-to-ldap-disabled': (event) => this.loginFailedDueToLdapDisabled(event),
            'sso-user-project-access-updated': (event) => this.ssoUserProjectAccessUpdated(event),
            'sso-user-instance-role-updated': (event) => this.ssoUserInstanceRoleUpdated(event),
            'workflow-created': (event) => this.workflowCreated(event),
            'workflow-archived': (event) => this.workflowArchived(event),
            'workflow-unarchived': (event) => this.workflowUnarchived(event),
            'workflow-deleted': (event) => this.workflowDeleted(event),
            'workflow-sharing-updated': (event) => this.workflowSharingUpdated(event),
            'n8n-package-imported': (event) => this.packageImported(event),
            'n8n-package-exported': (event) => this.packageExported(event),
            'n8n-package-export-failed': (event) => this.packageExportFailed(event),
            'n8n-package-import-failed': (event) => this.packageImportFailed(event),
            'workflow-saved': async (event) => await this.workflowSaved(event),
            'workflow-activated': async (event) => await this.workflowActivated(event),
            'workflow-deactivated': (event) => this.workflowDeactivated(event),
            'server-started': async () => await this.serverStarted(),
            'server-cli-import': (event) => this.serverCliImportCommand(event),
            'server-cli-export': (event) => this.serverCliExportCommand(event),
            'session-started': (event) => this.sessionStarted(event),
            'instance-stopped': () => this.instanceStopped(),
            'instance-owner-setup': async (event) => await this.instanceOwnerSetup(event),
            'first-production-workflow-succeeded': (event) => this.firstProductionWorkflowSucceeded(event),
            'instance-first-production-workflow-failed': (event) => this.instanceFirstProductionWorkflowFailed(event),
            'first-workflow-data-loaded': (event) => this.firstWorkflowDataLoaded(event),
            'workflow-post-execute': async (event) => await this.workflowPostExecute(event),
            'user-changed-role': (event) => this.userChangedRole(event),
            'user-retrieved-user': (event) => this.userRetrievedUser(event),
            'user-retrieved-all-users': (event) => this.userRetrievedAllUsers(event),
            'user-retrieved-execution': (event) => this.userRetrievedExecution(event),
            'user-retrieved-all-executions': (event) => this.userRetrievedAllExecutions(event),
            'user-retrieved-workflow': (event) => this.userRetrievedWorkflow(event),
            'user-retrieved-workflow-version': (event) => this.userRetrievedWorkflowVersion(event),
            'user-retrieved-all-workflows': (event) => this.userRetrievedAllWorkflows(event),
            'user-updated': (event) => this.userUpdated(event),
            'user-deleted': (event) => this.userDeleted(event),
            'user-invited': (event) => this.userInvited(event),
            'user-signed-up': (event) => this.userSignedUp(event),
            'user-submitted-personalization-survey': (event) => this.userSubmittedPersonalizationSurvey(event),
            'email-failed': (event) => this.emailFailed(event),
            'user-transactional-email-sent': (event) => this.userTransactionalEmailSent(event),
            'user-invite-email-click': (event) => this.userInviteEmailClick(event),
            'user-password-reset-email-click': (event) => this.userPasswordResetEmailClick(event),
            'user-password-reset-request-click': (event) => this.userPasswordResetRequestClick(event),
            'history-compacted': (event) => this.historyCompacted(event),
            'migration-report-viewed': (event) => this.migrationReportViewed(event),
            'instance-policies-updated': (event) => this.instancePoliciesUpdated(event),
            'execution-data-revealed': (event) => this.executionDataRevealed(event),
            'workflow-review-requested': (event) => this.workflowReviewRequested(event),
            'workflow-review-version-updated': (event) => this.workflowReviewVersionUpdated(event),
            'workflow-review-decided': (event) => this.workflowReviewDecided(event),
            'workflow-review-closed': (event) => this.workflowReviewClosed(event),
            'workflow-review-comment-created': (event) => this.workflowReviewCommentCreated(event),
            'custom-role-created': (event) => this.customRoleCreated(event),
            'custom-role-updated': (event) => this.customRoleUpdated(event),
            'custom-role-deleted': (event) => this.customRoleDeleted(event),
            'instance-ai-mcp-registry-connection-created': (event) => this.instanceAiMcpRegistryConnectionCreated(event),
            'instance-ai-mcp-registry-connection-deleted': (event) => this.instanceAiMcpRegistryConnectionDeleted(event),
            'hitl-response-actioned': (event) => this.hitlResponseActioned(event),
            'runner-disconnected': (event) => this.runnerDisconnected(event),
        });
    }
    hitlResponseActioned({ nodeType, approved, authorized, }) {
        this.telemetry.track('Advanced HITL response actioned', {
            node_type: nodeType,
            is_approved: approved,
            is_authorized: authorized,
        });
    }
    instanceAiMcpRegistryConnectionCreated({ userId, serverSlug, }) {
        this.telemetry.track('Instance AI mcp connected', {
            user_id: userId,
            server_slug: serverSlug,
        });
    }
    instanceAiMcpRegistryConnectionDeleted({ userId, serverSlug, }) {
        this.telemetry.track('Instance AI mcp disconnected', {
            user_id: userId,
            server_slug: serverSlug,
        });
    }
    teamProjectUpdated({ userId, role, members, projectId, otelProjectCustomTagsCount, }) {
        this.telemetry.track('Project settings updated', {
            user_id: userId,
            role,
            project_id: projectId,
            members: members?.map(({ userId: user_id, role }) => ({ user_id, role })),
            otel_project_custom_tags_count: otelProjectCustomTagsCount,
        });
    }
    teamProjectDeleted({ userId, role, projectId, removalType, targetProjectId, }) {
        this.telemetry.track('User deleted project', {
            user_id: userId,
            role,
            project_id: projectId,
            removal_type: removalType,
            target_project_id: targetProjectId,
        });
    }
    teamProjectCreated({ userId, role, uiContext }) {
        this.telemetry.track('User created project', {
            user_id: userId,
            role,
            uiContext,
        });
    }
    sourceControlSettingsUpdated({ branchName, readOnlyInstance, repoType, connected, connectionType, }) {
        this.telemetry.track('User updated source control settings', {
            branch_name: branchName,
            read_only_instance: readOnlyInstance,
            repo_type: repoType,
            connected,
            connection_type: connectionType,
        });
    }
    sourceControlUserStartedPullUi({ userId, workflowUpdates, workflowConflicts, credConflicts, publicApi, }) {
        this.telemetry.track('User started pull via UI', {
            user_id: userId,
            workflow_updates: workflowUpdates,
            workflow_conflicts: workflowConflicts,
            cred_conflicts: credConflicts,
            public_api: publicApi,
        });
    }
    sourceControlUserFinishedPullUi({ userId, workflowUpdates, }) {
        this.telemetry.track('User finished pull via UI', {
            user_id: userId,
            workflow_updates: workflowUpdates,
        });
    }
    sourceControlUserPulledApi({ workflowUpdates, forced, }) {
        this.telemetry.track('User pulled via API', {
            workflow_updates: workflowUpdates,
            forced,
        });
    }
    sourceControlUserStartedPushUi({ userId, workflowsEligible, workflowsEligibleWithConflicts, credsEligible, credsEligibleWithConflicts, variablesEligible, publicApi, }) {
        this.telemetry.track('User started push via UI', {
            user_id: userId,
            workflows_eligible: workflowsEligible,
            workflows_eligible_with_conflicts: workflowsEligibleWithConflicts,
            creds_eligible: credsEligible,
            creds_eligible_with_conflicts: credsEligibleWithConflicts,
            variables_eligible: variablesEligible,
            public_api: publicApi,
        });
    }
    sourceControlUserFinishedPushUi({ userId, workflowsEligible, workflowsPushed, credsPushed, variablesPushed, publicApi, }) {
        this.telemetry.track('User finished push via UI', {
            user_id: userId,
            workflows_eligible: workflowsEligible,
            workflows_pushed: workflowsPushed,
            creds_pushed: credsPushed,
            variables_pushed: variablesPushed,
            public_api: publicApi,
        });
    }
    licenseRenewalAttempted({ success }) {
        this.telemetry.track('Instance attempted to refresh license', {
            success,
        });
    }
    licenseCommunityPlusRegistered({ userId, email, licenseKey, }) {
        this.telemetry.track('User registered for license community plus', {
            user_id: userId,
            email,
            licenseKey,
        });
    }
    variableCreated({ user, projectId }) {
        this.telemetry.track('User created variable', {
            user_id: user.id,
            ...(projectId && { project_id: projectId }),
        });
    }
    variableUpdated({ user, projectId }) {
        this.telemetry.track('User updated variable', {
            user_id: user.id,
            ...(projectId && { project_id: projectId }),
        });
    }
    variableDeleted({ user, projectId }) {
        this.telemetry.track('User deleted variable', {
            user_id: user.id,
            ...(projectId && { project_id: projectId }),
        });
    }
    nodeTypePolicySaved({ updatedBy, kind, projectId, before, after, rulesBefore, rulesAfter, shadowWarningCount, notLoadedWarningCount, }) {
        if (!isPolicyKind(kind))
            return;
        const typeNames = kind === constants_2.CREDENTIAL_TYPES_KIND
            ? Object.keys(this.loadNodesAndCredentials.knownCredentials)
            : Object.keys(this.nodeTypes.getKnownTypes());
        const types = typeNames.map((0, package_resolver_1.policedTypeFor)(kind, this.nodeTypes, this.loadNodesAndCredentials));
        const resolvePackage = (0, package_resolver_1.packageResolverFor)(kind, this.loadNodesAndCredentials);
        this.telemetry.track(telemetry_1.TELEMETRY_EVENT.TYPE_AVAILABILITY_POLICIES.USER_SAVED_TYPE_AVAILABILITY_POLICY, {
            ...policyActor(updatedBy),
            kind,
            ...policyScope(projectId),
            default_action: after.defaultAction,
            previous_default_action: before?.defaultAction ?? null,
            is_first_write: before === null,
            ...countRuleActions(rulesAfter),
            ...countSelectorKinds(rulesAfter),
            ...summarizeTypeAvailability(rulesAfter, after.defaultAction, types, resolvePackage),
            previous_rule_count: rulesBefore?.length ?? null,
            shadow_warning_count: shadowWarningCount,
            not_loaded_warning_count: notLoadedWarningCount,
            version: after.version,
        });
    }
    nodeTypePolicyDocumentCreated({ updatedBy, kind, policyId, origin, after, }) {
        if (origin === 'composed-save')
            return;
        this.trackPolicyDocument(updatedBy, kind, policyId, 'created', after.rules, null);
    }
    nodeTypePolicyDocumentUpdated({ updatedBy, kind, policyId, origin, before, after, }) {
        if (origin === 'composed-save')
            return;
        this.trackPolicyDocument(updatedBy, kind, policyId, 'updated', after.rules, before.rules);
    }
    nodeTypePolicyDocumentDeleted({ updatedBy, kind, policyId, before, }) {
        this.trackPolicyDocument(updatedBy, kind, policyId, 'deleted', [], before.rules);
    }
    trackPolicyDocument(updatedBy, kind, policyId, operation, rulesAfter, rulesBefore) {
        if (!isPolicyKind(kind))
            return;
        this.telemetry.track(telemetry_1.TELEMETRY_EVENT.TYPE_AVAILABILITY_POLICIES.USER_UPDATED_TYPE_AVAILABILITY_POLICY_DOCUMENT, {
            ...policyActor(updatedBy),
            kind,
            operation,
            policy_id: policyId,
            ...countRuleActions(rulesAfter),
            previous_rule_count: rulesBefore?.length ?? null,
        });
    }
    nodeTypePolicyAttachmentsUpdated({ updatedBy, kind, projectId, scopeId, before, after, }) {
        if (!isPolicyKind(kind))
            return;
        this.telemetry.track(telemetry_1.TELEMETRY_EVENT.TYPE_AVAILABILITY_POLICIES.USER_UPDATED_TYPE_AVAILABILITY_POLICY_ATTACHMENTS, {
            ...policyActor(updatedBy),
            kind,
            ...policyScope(projectId),
            scope_id: scopeId,
            attachment_count: after.attachments.length,
            floor_attachment_count: after.attachments.filter((a) => a.isFloor).length,
            previous_attachment_count: before.attachments.length,
        });
    }
    policyDecisionBlocked(event) {
        this.telemetry.track(telemetry_1.TELEMETRY_EVENT.POLICIES.POLICY_BLOCKED_ACTION, {
            ...(event.actorType === 'user'
                ? { user_id: event.user.id, actor_type: 'user' }
                : { actor_type: 'system', system_reason: event.systemReason }),
            point: event.point,
            outcome: event.outcome,
            duration_ms: event.durationMs,
            check_ids: event.checkIds,
            violation_count: event.violations.length,
            violations: event.violations.slice(0, MAX_LISTED_VIOLATIONS).map((violation) => ({
                check_id: violation.checkId,
                kind: violation.kind,
                subject_type: violation.subjectType,
                subject: violation.subjectType !== null && TYPE_NAME_SUBJECT_TYPES.has(violation.subjectType)
                    ? violation.subject
                    : null,
                scope: violation.scope,
                matched_rule: violation.matchedRuleId !== null,
            })),
            target_type: policedTargetType(event),
            workflow_id: event.workflowId,
            agent_id: event.agentId,
            credential_id: event.credentialId,
            credential_type: event.credentialType,
            consumer_node_type: event.consumerNodeType,
            project_id: event.projectId,
        });
    }
    externalSecretsProviderSettingsSaved({ userId, vaultType, isValid, isNew, errorMessage, }) {
        this.telemetry.track('User updated external secrets settings', {
            user_id: userId,
            vault_type: vaultType,
            is_valid: isValid,
            is_new: isNew,
            error_message: errorMessage,
        });
    }
    externalSecretsProviderReloaded({ vaultType, }) {
        this.telemetry.track('User reloaded external secrets', {
            vault_type: vaultType,
        });
    }
    externalSecretsConnectionCreated({ userId, userRole, vaultType, projects, }) {
        this.telemetry.track('User created external secrets connection', {
            user_id: userId,
            user_role: userRole,
            vault_type: vaultType,
            scope: projects.length === 0 ? 'global' : 'project',
            project_ids: projects.map((project) => project.id),
        });
    }
    externalSecretsConnectionUpdated({ userId, userRole, vaultType, projects, }) {
        this.telemetry.track('User updated external secrets connection', {
            user_id: userId,
            user_role: userRole,
            vault_type: vaultType,
            scope: projects.length === 0 ? 'global' : 'project',
            project_ids: projects.map((project) => project.id),
        });
    }
    externalSecretsConnectionDeleted({ userId, userRole, vaultType, projects, }) {
        this.telemetry.track('User deleted external secrets connection', {
            user_id: userId,
            user_role: userRole,
            vault_type: vaultType,
            scope: projects.length === 0 ? 'global' : 'project',
            project_ids: projects.map((project) => project.id),
        });
    }
    externalSecretsSystemRolesToggled({ userId, enabled, }) {
        this.telemetry.track('User toggled external secrets system roles', {
            user_id: userId,
            enabled,
        });
    }
    publicApiInvoked({ userId, path, method, apiVersion, userAgent, }) {
        this.telemetry.trackApiInvocation({
            user_id: userId,
            path,
            method,
            api_version: apiVersion,
            user_agent: userAgent,
        });
    }
    publicApiKeyCreated(event) {
        const { user, publicApi } = event;
        this.telemetry.track('API key created', {
            user_id: user.id,
            public_api: publicApi,
        });
    }
    publicApiKeyDeleted(event) {
        const { user, publicApi, isOwn } = event;
        this.telemetry.track('API key deleted', {
            user_id: user.id,
            public_api: publicApi,
            is_own: isOwn,
        });
    }
    publicApiKeyRotated(event) {
        const { user, publicApi } = event;
        this.telemetry.track('API key rotated', {
            user_id: user.id,
            public_api: publicApi,
        });
    }
    communityPackageInstalled({ user, inputString, packageName, success, packageVersion, packageNodeNames, packageAuthor, packageAuthorEmail, failureReason, }) {
        this.telemetry.track('cnr package install finished', {
            user_id: user.id,
            input_string: inputString,
            package_name: packageName,
            success,
            package_version: packageVersion,
            package_node_names: packageNodeNames,
            package_author: packageAuthor,
            package_author_email: packageAuthorEmail,
            failure_reason: failureReason,
        });
    }
    communityPackageUpdated({ user, packageName, packageVersionCurrent, packageVersionNew, packageNodeNames, packageAuthor, packageAuthorEmail, }) {
        this.telemetry.track('cnr package updated', {
            user_id: user.id,
            package_name: packageName,
            package_version_current: packageVersionCurrent,
            package_version_new: packageVersionNew,
            package_node_names: packageNodeNames,
            package_author: packageAuthor,
            package_author_email: packageAuthorEmail,
        });
    }
    communityPackageDeleted({ user, packageName, packageVersion, packageNodeNames, packageAuthor, packageAuthorEmail, }) {
        this.telemetry.track('cnr package deleted', {
            user_id: user.id,
            package_name: packageName,
            package_version: packageVersion,
            package_node_names: packageNodeNames,
            package_author: packageAuthor,
            package_author_email: packageAuthorEmail,
        });
    }
    credentialsCreated({ user, credentialType, credentialId, credentialDescriptionLength, publicApi, projectId, projectType, uiContext, isDynamic, usesExternalSecrets, jweEnabled, supportsManagedAuth, usesManagedAuth, }) {
        this.telemetry.track(telemetry_1.TELEMETRY_EVENT.CREDENTIALS.USER_CREATED_CREDENTIALS, {
            ...(credentialDescriptionLength !== undefined && {
                source: 'backend',
                public_api: publicApi,
            }),
            user_id: user.id,
            user_role: user.role?.slug,
            credential_type: credentialType,
            credential_id: credentialId,
            ...(credentialDescriptionLength !== undefined && {
                has_description: credentialDescriptionLength > 0,
                description_length: credentialDescriptionLength,
            }),
            project_id: projectId,
            project_type: projectType,
            uiContext,
            is_private: isDynamic ?? false,
            uses_external_secrets: usesExternalSecrets ?? false,
            jwe_enabled: jweEnabled ?? false,
            credential_supports_managed_auth: supportsManagedAuth ?? false,
            credential_uses_managed_auth: usesManagedAuth ?? false,
        });
    }
    credentialsShared({ user, credentialType, credentialId, userIdSharer, userIdsShareesAdded, shareesRemoved, }) {
        this.telemetry.track('User updated cred sharing', {
            user_id: user.id,
            user_role: user.role?.slug,
            credential_type: credentialType,
            credential_id: credentialId,
            user_id_sharer: userIdSharer,
            user_ids_sharees_added: userIdsShareesAdded,
            sharees_removed: shareesRemoved,
        });
    }
    credentialsUpdated({ user, credentialId, credentialType, credentialDescriptionLength, isDynamic, usesExternalSecrets, jweEnabled, supportsManagedAuth, usesManagedAuth, }) {
        this.telemetry.track(telemetry_1.TELEMETRY_EVENT.CREDENTIALS.USER_UPDATED_CREDENTIALS, {
            ...(credentialDescriptionLength !== undefined && { source: 'backend' }),
            user_id: user.id,
            user_role: user.role?.slug,
            credential_type: credentialType,
            credential_id: credentialId,
            ...(credentialDescriptionLength !== undefined && {
                has_description: credentialDescriptionLength > 0,
                description_length: credentialDescriptionLength,
            }),
            is_private: isDynamic ?? false,
            uses_external_secrets: usesExternalSecrets ?? false,
            jwe_enabled: jweEnabled ?? false,
            credential_supports_managed_auth: supportsManagedAuth ?? false,
            credential_uses_managed_auth: usesManagedAuth ?? false,
        });
    }
    credentialsDeleted({ user, credentialId, credentialType, }) {
        this.telemetry.track('User deleted credentials', {
            user_id: user.id,
            user_role: user.role?.slug,
            credential_type: credentialType,
            credential_id: credentialId,
        });
    }
    credentialsUserDisconnected({ user, credentialId, credentialType, }) {
        this.telemetry.track('User disconnected own credential connection', {
            user_id: user.id,
            user_role: user.role?.slug,
            credential_type: credentialType,
            credential_id: credentialId,
        });
    }
    credentialsProbed({ user, credentialId, outcome }) {
        this.telemetry.track(telemetry_1.TELEMETRY_EVENT.CREDENTIALS.USER_PROBED_CREDENTIAL, {
            user_id: user.id,
            credential_id: credentialId,
            outcome,
        });
    }
    privateCredentialCreated({ user, credentialId, credentialType, projectId, projectType, }) {
        this.telemetry.track('User created end-user credential', {
            user_id: user.id,
            user_role: user.role?.slug,
            credential_type: credentialType,
            credential_id: credentialId,
            project_id: projectId,
            project_type: projectType,
        });
    }
    privateCredentialToggledToPrivate({ user, credentialId, credentialType, }) {
        this.telemetry.track('User made credential end-user', {
            user_id: user.id,
            user_role: user.role?.slug,
            credential_type: credentialType,
            credential_id: credentialId,
        });
    }
    privateCredentialToggledToStatic({ user, credentialId, credentialType, }) {
        this.telemetry.track('User made credential fixed', {
            user_id: user.id,
            user_role: user.role?.slug,
            credential_type: credentialType,
            credential_id: credentialId,
        });
    }
    privateCredentialConnectionsCleared({ user, credentialId, credentialType, }) {
        this.telemetry.track('User cleared end-user credential connections', {
            user_id: user.id,
            user_role: user.role?.slug,
            credential_type: credentialType,
            credential_id: credentialId,
        });
    }
    privateCredentialDeleted({ user, credentialId, credentialType, }) {
        this.telemetry.track('User deleted end-user credential', {
            user_id: user.id,
            user_role: user.role?.slug,
            credential_type: credentialType,
            credential_id: credentialId,
        });
    }
    privateCredentialUserConnected({ user, credentialId, credentialType, supportsManagedAuth, usesManagedAuth, }) {
        this.telemetry.track('User connected to end-user credential', {
            user_id: user.id,
            user_role: user.role?.slug,
            credential_type: credentialType,
            credential_id: credentialId,
            credential_supports_managed_auth: supportsManagedAuth ?? false,
            credential_uses_managed_auth: usesManagedAuth ?? false,
        });
    }
    ldapGeneralSyncFinished({ type, succeeded, usersSynced, error, }) {
        this.telemetry.track('Ldap general sync finished', {
            type,
            succeeded,
            users_synced: usersSynced,
            error,
        });
    }
    ldapSettingsUpdated({ userId, loginIdAttribute, firstNameAttribute, lastNameAttribute, emailAttribute, ldapIdAttribute, searchPageSize, searchTimeout, synchronizationEnabled, synchronizationInterval, loginLabel, loginEnabled, }) {
        this.telemetry.track('User updated Ldap settings', {
            user_id: userId,
            loginIdAttribute,
            firstNameAttribute,
            lastNameAttribute,
            emailAttribute,
            ldapIdAttribute,
            searchPageSize,
            searchTimeout,
            synchronizationEnabled,
            synchronizationInterval,
            loginLabel,
            loginEnabled,
        });
    }
    ldapLoginSyncFailed({ error }) {
        this.telemetry.track('Ldap login sync failed', { error });
    }
    loginFailedDueToLdapDisabled({ userId, }) {
        this.telemetry.track('User login failed since ldap disabled', { user_ud: userId });
    }
    ssoUserProjectAccessUpdated({ projectsRemoved, projectsAdded, userId, }) {
        this.telemetry.track('Sso user project access update', {
            user_id: userId,
            projects_removed: projectsRemoved,
            projects_added: projectsAdded,
        });
    }
    ssoUserInstanceRoleUpdated({ userId, role, }) {
        this.telemetry.track('Sso user instance role update', { user_id: userId, role });
    }
    workflowCreated({ user, workflow, publicApi, projectId, projectType, uiContext, source = 'ui', }) {
        const { nodeGraph } = n8n_workflow_1.TelemetryHelpers.generateNodesGraph(workflow, this.nodeTypes);
        this.telemetry.track('User created workflow', {
            user_id: user.id,
            workflow_id: workflow.id,
            node_graph_string: limitNodeGraphStringSize(JSON.stringify(nodeGraph)),
            public_api: publicApi,
            project_id: projectId,
            project_type: projectType,
            meta: JSON.stringify(workflow.meta),
            otel_workflow_custom_tags_count: countWorkflowCustomTelemetryTags(workflow),
            otel_nodes_with_custom_tags_count: countNodesWithCustomTelemetryTags(workflow.nodes),
            otel_node_custom_tags_count: countNodeCustomTelemetryTags(workflow.nodes),
            uiContext,
            source,
        });
    }
    workflowArchived({ user, workflowId, publicApi }) {
        this.telemetry.track('User archived workflow', {
            user_id: user.id,
            workflow_id: workflowId,
            public_api: publicApi,
        });
    }
    workflowUnarchived({ user, workflowId, publicApi, }) {
        this.telemetry.track('User unarchived workflow', {
            user_id: user.id,
            workflow_id: workflowId,
            public_api: publicApi,
        });
    }
    workflowDeleted({ user, workflowId, publicApi }) {
        this.telemetry.track('User deleted workflow', {
            user_id: user.id,
            workflow_id: workflowId,
            public_api: publicApi,
        });
    }
    async getPrivateCredentialUsage(workflow) {
        const empty = {
            privateCredentialsCount: 0,
            privateCredentialTypes: [],
        };
        if (!this.licenseState.isDynamicCredentialsLicensed()) {
            return empty;
        }
        const credentialIds = new Set();
        for (const node of workflow.nodes) {
            for (const credential of Object.values(node.credentials ?? {})) {
                if (credential?.id)
                    credentialIds.add(credential.id);
            }
        }
        if (credentialIds.size === 0) {
            return empty;
        }
        const privateCredentials = await this.credentialsRepository.find({
            where: { id: (0, db_1.In)([...credentialIds]), isResolvable: true },
            select: ['id', 'type'],
        });
        return {
            privateCredentialsCount: privateCredentials.length,
            privateCredentialTypes: [...new Set(privateCredentials.map((credential) => credential.type))],
        };
    }
    async workflowActivated({ user, workflowId, workflow, publicApi, source = 'ui', }) {
        const { privateCredentialsCount, privateCredentialTypes } = await this.getPrivateCredentialUsage(workflow);
        const featureFlagUser = 'createdAt' in user && user.createdAt instanceof Date
            ? { id: user.id, createdAt: user.createdAt }
            : undefined;
        const featureFlags = featureFlagUser
            ? await this.postHogClient.getFeatureFlags(featureFlagUser).catch(() => ({}))
            : {};
        const emptyGroupCount = featureFlags[api_types_1.EMPTY_CANVAS_GROUPS_FLAG] === true
            ? countPublishedEmptyGroups(workflow)
            : undefined;
        this.telemetry.track(telemetry_1.TELEMETRY_EVENT.WORKFLOW.USER_ACTIVATED_WORKFLOW, {
            user_id: user.id,
            workflow_id: workflowId,
            public_api: publicApi,
            source,
            private_credentials_count: privateCredentialsCount,
            private_credential_types: privateCredentialTypes,
            ...(emptyGroupCount !== undefined ? { empty_group_count: emptyGroupCount } : {}),
        });
    }
    workflowDeactivated({ user, workflowId, publicApi, deactivatedVersionId, source = 'ui', }) {
        this.telemetry.track('User deactivated workflow', {
            user_id: user.id,
            workflow_id: workflowId,
            public_api: publicApi,
            deactivated_version_id: deactivatedVersionId,
            source,
        });
    }
    workflowSharingUpdated({ workflowId, userIdSharer, userIdList, }) {
        this.telemetry.track('User updated workflow sharing', {
            workflow_id: workflowId,
            user_id_sharer: userIdSharer,
            user_id_list: userIdList,
        });
    }
    packageImported({ user, options, counts }) {
        this.telemetry.track('User imported n8n package', {
            user_id: user.id,
            workflow_conflict_policy: options.workflowConflictPolicy,
            workflow_id_policy: options.workflowIdPolicy,
            credential_matching_mode: options.credentialMatchingMode,
            credential_missing_mode: options.credentialMissingMode,
            credential_conflict_policy: options.credentialConflictPolicy,
            workflow_publishing_policy: options.workflowPublishingPolicy,
            missing_node_type_mode: options.missingNodeTypeMode,
            project_conflict_policy: options.projectConflictPolicy,
            folder_conflict_policy: options.folderConflictPolicy,
            overwrite_deletion_policy: options.overwriteDeletionPolicy,
            data_table_matching_mode: options.dataTableMatchingMode,
            data_table_missing_mode: options.dataTableMissingMode,
            data_table_schema_conflict_policy: options.dataTableSchemaConflictPolicy,
            variable_missing_mode: options.variableMissingMode,
            variable_conflict_policy: options.variableConflictPolicy,
            variable_parent_policy: options.variableParentPolicy,
            tag_missing_mode: options.tagMissingMode,
            tag_conflict_policy: options.tagConflictPolicy,
            workflows_created: counts.workflows.created,
            workflows_updated: counts.workflows.updated,
            workflows_skipped: counts.workflows.skipped,
            workflows_archived: counts.workflows.archived,
            workflows_deleted: counts.workflows.deleted,
            folders_removed: counts.folders.removed,
            credentials_matched: counts.credentials.matched,
            credentials_created: counts.credentials.created,
            credentials_required: counts.credentials.requirements,
            data_tables_matched: counts.dataTables.matched,
            data_tables_created: counts.dataTables.created,
            data_tables_updated: counts.dataTables.updated,
            data_tables_required: counts.dataTables.requirements,
            variables_matched: counts.variables.matched,
            variables_missing: counts.variables.missing,
            variables_with_value_created: counts.variables.created,
            variables_stubs_created: counts.variables.stubbed,
            variables_updated: counts.variables.updated,
            variables_required: counts.variables.requirements,
            tags_matched: counts.tags.matched,
            tags_created: counts.tags.created,
            tags_renamed: counts.tags.renamed,
            tags_reconciled: counts.tags.reconciled,
            tags_skipped: counts.tags.skipped,
            tags_required: counts.tags.requirements,
        });
    }
    packageExported({ user, counts, credentialExportPolicy, includeArchivedWorkflows, }) {
        this.telemetry.track('User exported n8n package', {
            user_id: user.id,
            agent_count: counts.agents,
            workflow_count: counts.workflows,
            folder_count: counts.folders,
            credential_count: counts.credentials,
            data_table_count: counts.dataTables,
            variable_count: counts.variables,
            tag_count: counts.tags,
            credential_export_policy: credentialExportPolicy,
            include_archived_workflows: includeArchivedWorkflows,
        });
    }
    packageExportFailed({ user, reason, agentIds, workflowIds, folderIds, projectIds, }) {
        this.telemetry.track('User package export failed', {
            user_id: user.id,
            reason,
            agent_count: agentIds?.length ?? 0,
            workflow_count: workflowIds?.length ?? 0,
            folder_count: folderIds?.length ?? 0,
            project_count: projectIds?.length ?? 0,
        });
    }
    packageImportFailed({ user, reason }) {
        this.telemetry.track('User package import failed', {
            user_id: user.id,
            reason,
        });
    }
    async workflowSaved({ user, workflow, publicApi, previousWorkflow, aiBuilderAssisted, settingsChanged, source = 'ui', }) {
        const isCloudDeployment = this.globalConfig.deployment.type === 'cloud';
        const { nodeGraph } = n8n_workflow_1.TelemetryHelpers.generateNodesGraph(workflow, this.nodeTypes, {
            isCloudDeployment,
        });
        let userRole = undefined;
        const role = await this.sharedWorkflowRepository.findSharingRole(user.id, workflow.id);
        if (role) {
            userRole = role === 'workflow:owner' ? 'owner' : 'sharee';
        }
        else {
            const workflowOwner = await this.sharedWorkflowRepository.getWorkflowOwningProject(workflow.id);
            if (workflowOwner) {
                const projectRole = await this.projectRelationRepository.findProjectRole({
                    userId: user.id,
                    projectId: workflowOwner.id,
                });
                if (projectRole && projectRole?.slug !== permissions_1.PROJECT_OWNER_ROLE_SLUG) {
                    userRole = 'member';
                }
            }
        }
        const notesCount = Object.keys(nodeGraph.notes).length;
        const overlappingCount = Object.values(nodeGraph.notes).filter((note) => note.overlapping).length;
        let workflowEditedNoPos = false;
        let credentialEdited = false;
        if (previousWorkflow) {
            workflowEditedNoPos = (0, n8n_workflow_1.hasNonPositionalChanges)(previousWorkflow.nodes, workflow.nodes, previousWorkflow.connections, workflow.connections);
            credentialEdited = (0, n8n_workflow_1.hasCredentialChanges)(previousWorkflow.nodes, workflow.nodes);
        }
        let credentialResolverId = undefined;
        if (settingsChanged?.credentialResolverId) {
            credentialResolverId =
                settingsChanged.credentialResolverId.to ??
                    this.dynamicCredentialsProxy.getSystemResolverId() ??
                    undefined;
        }
        let redactionPolicy = undefined;
        if (settingsChanged?.redactionPolicy) {
            redactionPolicy = settingsChanged.redactionPolicy.to;
        }
        const identityExtractorChanged = this.detectIdentityExtractorChanges(previousWorkflow, workflow);
        const { privateCredentialsCount, privateCredentialTypes } = await this.getPrivateCredentialUsage(workflow);
        this.telemetry.track('User saved workflow', {
            user_id: user.id,
            workflow_id: workflow.id,
            node_graph_string: limitNodeGraphStringSize(JSON.stringify(nodeGraph)),
            notes_count_overlapping: overlappingCount,
            notes_count_non_overlapping: notesCount - overlappingCount,
            version_cli: constants_1.N8N_VERSION,
            num_tags: workflow.tags?.length ?? 0,
            public_api: publicApi,
            sharing_role: userRole,
            meta: JSON.stringify(workflow.meta),
            workflow_edited_no_pos: workflowEditedNoPos,
            credential_edited: credentialEdited,
            ai_builder_assisted: aiBuilderAssisted ?? false,
            credential_resolver_id: credentialResolverId,
            identity_extractor_changed: identityExtractorChanged,
            redaction_policy: redactionPolicy,
            private_credentials_count: privateCredentialsCount,
            private_credential_types: privateCredentialTypes,
            otel_workflow_custom_tags_count: countWorkflowCustomTelemetryTags(workflow),
            otel_nodes_with_custom_tags_count: countNodesWithCustomTelemetryTags(workflow.nodes),
            otel_node_custom_tags_count: countNodeCustomTelemetryTags(workflow.nodes),
            source,
        });
    }
    async workflowPostExecute({ workflow, runData, userId, source, telemetryMetadata, }) {
        if (!workflow.id) {
            return;
        }
        const executionTelemetryProperties = getExecutionTelemetryProperties(source, telemetryMetadata);
        let privateCredentialsAttemptedCount = 0;
        let privateCredentialsResolvedCount = 0;
        for (const taskDataList of Object.values(runData?.data?.resultData?.runData ?? {})) {
            if (taskDataList.some((taskData) => taskData.attemptedDynamicCredentials)) {
                privateCredentialsAttemptedCount++;
            }
            if (taskDataList.some((taskData) => taskData.usedDynamicCredentials)) {
                privateCredentialsResolvedCount++;
            }
        }
        const telemetryProperties = {
            workflow_id: workflow.id,
            is_manual: false,
            version_cli: constants_1.N8N_VERSION,
            success: false,
            ...executionTelemetryProperties,
            used_end_user_credentials: privateCredentialsAttemptedCount > 0,
            end_user_credentials_attempted_count: privateCredentialsAttemptedCount,
            end_user_credentials_resolved_count: privateCredentialsResolvedCount,
        };
        if (privateCredentialsAttemptedCount > 0) {
            const resolverId = this.dynamicCredentialsProxy.getEffectiveResolverId(workflow.settings);
            if (resolverId) {
                telemetryProperties.credential_resolver_id = resolverId;
            }
        }
        if (userId) {
            telemetryProperties.user_id = userId;
        }
        if (runData?.data.resultData.error?.message?.includes('canceled')) {
            runData.status = 'canceled';
        }
        telemetryProperties.success = !!runData?.finished;
        const executionStatus = runData
            ? (0, shared_hook_functions_1.determineFinalExecutionStatus)(runData)
            : 'unknown';
        if (runData !== undefined) {
            telemetryProperties.execution_mode = runData.mode;
            telemetryProperties.is_manual = runData.mode === 'manual';
            telemetryProperties.crashed = executionStatus === 'crashed';
            let nodeGraphResult = null;
            if (!telemetryProperties.success && runData?.data.resultData.error) {
                if (n8n_workflow_1.TelemetryHelpers.userInInstanceRanOutOfFreeAiCredits(runData)) {
                    this.telemetry.track('User ran out of free AI credits');
                }
                telemetryProperties.error_message = runData?.data.resultData.error.message;
                let errorNodeName = 'node' in runData?.data.resultData.error
                    ? runData?.data.resultData.error.node?.name
                    : undefined;
                telemetryProperties.error_node_type =
                    'node' in runData?.data.resultData.error
                        ? runData?.data.resultData.error.node?.type
                        : undefined;
                if (runData.data.resultData.lastNodeExecuted) {
                    const lastNode = n8n_workflow_1.TelemetryHelpers.getNodeTypeForName(workflow, runData.data.resultData.lastNodeExecuted);
                    if (lastNode !== undefined) {
                        telemetryProperties.error_node_type = lastNode.type;
                        errorNodeName = lastNode.name;
                    }
                }
                if (telemetryProperties.is_manual) {
                    nodeGraphResult = n8n_workflow_1.TelemetryHelpers.generateNodesGraph(workflow, this.nodeTypes, {
                        runData: runData.data.resultData?.runData,
                    });
                    telemetryProperties.node_graph = nodeGraphResult.nodeGraph;
                    telemetryProperties.node_graph_string = limitNodeGraphStringSize(JSON.stringify(nodeGraphResult.nodeGraph));
                    if (errorNodeName) {
                        telemetryProperties.error_node_id = nodeGraphResult.nameIndices[errorNodeName];
                    }
                }
            }
            if (telemetryProperties.is_manual) {
                if (!nodeGraphResult) {
                    nodeGraphResult = n8n_workflow_1.TelemetryHelpers.generateNodesGraph(workflow, this.nodeTypes, {
                        runData: runData.data.resultData?.runData,
                    });
                }
                let userRole = undefined;
                if (userId) {
                    const role = await this.sharedWorkflowRepository.findSharingRole(userId, workflow.id);
                    if (role) {
                        userRole = role === 'workflow:owner' ? 'owner' : 'sharee';
                    }
                }
                const manualExecEventProperties = {
                    user_id: userId,
                    workflow_id: workflow.id,
                    status: executionStatus,
                    executionStatus: runData?.status ?? 'unknown',
                    error_message: telemetryProperties.error_message,
                    error_node_type: telemetryProperties.error_node_type,
                    node_graph_string: telemetryProperties.node_graph_string,
                    error_node_id: telemetryProperties.error_node_id,
                    webhook_domain: null,
                    sharing_role: userRole,
                    credential_type: null,
                    is_managed: false,
                    eval_rows_left: null,
                    meta: JSON.stringify(workflow.meta),
                    used_end_user_credentials: telemetryProperties.used_end_user_credentials,
                    end_user_credentials_attempted_count: telemetryProperties.end_user_credentials_attempted_count,
                    end_user_credentials_resolved_count: telemetryProperties.end_user_credentials_resolved_count,
                    credential_resolver_id: telemetryProperties.credential_resolver_id,
                    ...executionTelemetryProperties,
                    ...n8n_workflow_1.TelemetryHelpers.resolveAIMetrics(workflow.nodes, this.nodeTypes),
                    ...n8n_workflow_1.TelemetryHelpers.resolveVectorStoreMetrics(workflow.nodes, this.nodeTypes, runData),
                    ...n8n_workflow_1.TelemetryHelpers.extractLastExecutedNodeStructuredOutputErrorInfo(workflow, this.nodeTypes, runData),
                };
                if (!manualExecEventProperties.node_graph_string) {
                    nodeGraphResult = n8n_workflow_1.TelemetryHelpers.generateNodesGraph(workflow, this.nodeTypes, {
                        runData: runData.data.resultData?.runData,
                    });
                    manualExecEventProperties.node_graph_string = limitNodeGraphStringSize(JSON.stringify(nodeGraphResult.nodeGraph));
                }
                nodeGraphResult?.evaluationTriggerNodeNames?.forEach((name) => {
                    const rowsLeft = runData.data.resultData.runData[name]?.[0]?.data?.main?.[0]?.[0]?.json?._rowsLeft;
                    if (typeof rowsLeft === 'number') {
                        manualExecEventProperties.eval_rows_left = rowsLeft;
                    }
                });
                if (runData.data.startData?.destinationNode) {
                    const credentialsData = n8n_workflow_1.TelemetryHelpers.extractLastExecutedNodeCredentialData(runData);
                    if (credentialsData) {
                        manualExecEventProperties.credential_type = credentialsData.credentialType;
                        const credential = await this.credentialsRepository.findOneBy({
                            id: credentialsData.credentialId,
                        });
                        if (credential) {
                            manualExecEventProperties.is_managed = credential.isManaged;
                        }
                    }
                    const destinationNodeName = runData.data.startData?.destinationNode.nodeName;
                    const telemetryPayload = {
                        ...manualExecEventProperties,
                        node_type: n8n_workflow_1.TelemetryHelpers.getNodeTypeForName(workflow, destinationNodeName)?.type,
                        node_id: nodeGraphResult.nameIndices[destinationNodeName],
                        node_role: n8n_workflow_1.TelemetryHelpers.getNodeRole(destinationNodeName, workflow.connections, this.nodeTypes, workflow.nodes),
                    };
                    this.telemetry.track('Manual node exec finished', telemetryPayload);
                }
                else {
                    for (const name of nodeGraphResult.webhookNodeNames) {
                        const execJson = runData.data.resultData.runData[name]?.[0]?.data?.main?.[0]?.[0]
                            ?.json;
                        if (execJson?.headers?.origin && execJson.headers.origin !== '') {
                            const { get: pslGet } = await import('psl');
                            manualExecEventProperties.webhook_domain = pslGet(execJson.headers.origin.replace(/^https?:\/\//, ''));
                        }
                    }
                    this.telemetry.track('Manual workflow exec finished', manualExecEventProperties);
                }
            }
        }
        this.telemetry.trackWorkflowExecution(telemetryProperties);
    }
    async serverStarted() {
        const cpus = node_os_1.default.cpus();
        const otel = await this.getOtelTelemetryInfo();
        const settingsManagedByEnvVars = this.getSettingsManagedByEnvVarsTelemetryInfo();
        const isS3Selected = this.binaryDataConfig.mode === 's3';
        const isS3Available = this.binaryDataConfig.availableModes.includes('s3');
        const isS3Licensed = this.license.isBinaryDataS3Licensed();
        const authenticationMethod = config_2.default.getEnv('userManagement.authenticationMethod');
        const dbVersion = await this.dbConnection.getDbVersion();
        const runtime = (0, detect_runtime_1.detectRuntime)(process.env, this.instanceSettings.isDocker);
        const memoryLimit = (0, container_limits_1.getMemoryLimit)();
        const cpu = (0, container_limits_1.getCpuLimit)();
        const info = {
            version_cli: constants_1.N8N_VERSION,
            db_type: this.globalConfig.database.type,
            db_version: dbVersion,
            n8n_version_notifications_enabled: this.globalConfig.versionNotifications.enabled,
            n8n_disable_production_main_process: this.globalConfig.endpoints.disableProductionWebhooksOnMainProcess,
            system_info: {
                os: {
                    type: node_os_1.default.type(),
                    version: node_os_1.default.version(),
                },
                memory: node_os_1.default.totalmem() / 1024,
                cpus: {
                    count: cpus.length,
                    model: cpus[0].model,
                    speed: cpus[0].speed,
                },
                is_docker: this.instanceSettings.isDocker,
                memory_limit: memoryLimit === null ? null : memoryLimit / 1024,
                cpu_limit: cpu.limit,
                cpu_limit_source: cpu.source,
                cpu_weight: cpu.weight,
                runtime,
                kubernetes_provider: runtime === 'kubernetes' ? (0, detect_runtime_1.detectKubernetesProvider)(node_os_1.default.release()) : undefined,
            },
            execution_variables: {
                executions_mode: this.globalConfig.executions.mode,
                executions_timeout: this.globalConfig.executions.timeout,
                executions_timeout_max: this.globalConfig.executions.maxTimeout,
                executions_data_save_on_error: this.globalConfig.executions.saveDataOnError,
                executions_data_save_on_success: this.globalConfig.executions.saveDataOnSuccess,
                executions_data_save_on_progress: this.globalConfig.executions.saveExecutionProgress,
                executions_data_save_manual_executions: this.globalConfig.executions.saveDataManualExecutions,
                executions_data_prune: this.globalConfig.executions.pruneData,
                executions_data_max_age: this.globalConfig.executions.pruneDataMaxAge,
            },
            workflow_history: {
                compaction_optimizing_time_window_hours: this.globalConfig.workflowHistoryCompaction.optimizingTimeWindowHours,
                compaction_trimming_time_window_days: this.globalConfig.workflowHistoryCompaction.trimmingTimeWindowDays,
            },
            n8n_deployment_type: this.globalConfig.deployment.type,
            n8n_deployment_artifact: this.globalConfig.deployment.artifact || undefined,
            n8n_binary_data_mode: this.binaryDataConfig.mode,
            smtp_set_up: this.globalConfig.userManagement.emails.mode === 'smtp',
            ldap_allowed: authenticationMethod === 'ldap',
            saml_enabled: authenticationMethod === 'saml',
            license_plan_name: this.license.getPlanName(),
            license_tenant_id: this.globalConfig.license.tenantId,
            binary_data_s3: isS3Available && isS3Selected && isS3Licensed,
            multi_main_setup_enabled: this.globalConfig.multiMainSetup.enabled,
            instance_ai: {
                sandbox_enabled: this.globalConfig.instanceAi.sandboxEnabled,
                sandbox_provider: this.globalConfig.instanceAi.sandboxProvider,
                search_brave_set: this.globalConfig.instanceAi.braveSearchApiKey !== '',
                search_searxng_set: this.globalConfig.instanceAi.searxngUrl !== '',
                model_env_set: this.globalConfig.instanceAi.modelApiKey !== '' ||
                    this.globalConfig.instanceAi.modelUrl !== '',
                model_id: this.globalConfig.instanceAi.model,
            },
            metrics: {
                metrics_enabled: this.globalConfig.endpoints.metrics.enable,
                metrics_category_default: this.globalConfig.endpoints.metrics.includeDefaultMetrics,
                metrics_category_routes: this.globalConfig.endpoints.metrics.includeApiEndpoints,
                metrics_category_cache: this.globalConfig.endpoints.metrics.includeCacheMetrics,
                metrics_category_logs: this.globalConfig.endpoints.metrics.includeMessageEventBusMetrics,
                metrics_category_queue: this.globalConfig.endpoints.metrics.includeQueueMetrics,
                metrics_category_execution_data: this.globalConfig.endpoints.metrics.includeExecutionDataMetrics,
                metrics_category_webhooks: this.globalConfig.endpoints.metrics.includeWebhookMetrics,
                metrics_category_forms: this.globalConfig.endpoints.metrics.includeFormMetrics,
                metrics_category_workflow_info: this.globalConfig.endpoints.metrics.includeWorkflowInfoMetrics,
            },
        };
        const firstWorkflow = await this.workflowRepository.findOne({
            select: ['createdAt'],
            order: { createdAt: 'ASC' },
            where: {},
        });
        const instanceGroupFacts = await this.getInstanceGroupFacts();
        this.telemetry.groupIdentify({
            traits: instanceGroupFacts,
            postHog: { userId: await this.getInstanceOwnerId(), traits: instanceGroupFacts },
        });
        this.telemetry.identify(info);
        this.telemetry.track(telemetry_1.TELEMETRY_EVENT.INSTANCE.INSTANCE_STARTED, {
            ...info,
            earliest_workflow_created: firstWorkflow?.createdAt,
            otel,
            settings_managed_by_env_vars: settingsManagedByEnvVars,
        });
    }
    async getInstanceGroupFacts() {
        const versionParts = getSemanticVersioning(constants_1.N8N_VERSION);
        const authenticationMethod = config_2.default.getEnv('userManagement.authenticationMethod');
        const dbVersion = await this.dbConnection.getDbVersion();
        return this.telemetry.sanitizeTelemetryProperties({
            n8n_host: this.globalConfig.host,
            version_cli: constants_1.N8N_VERSION,
            version_cli_major: versionParts.major,
            version_cli_minor: versionParts.minor,
            version_cli_patch: versionParts.patch,
            release_channel: this.globalConfig.generic.releaseChannel,
            executions_mode: this.globalConfig.executions.mode,
            n8n_deployment_type: this.globalConfig.deployment.type,
            n8n_deployment_artifact: this.globalConfig.deployment.artifact || undefined,
            db_type: this.globalConfig.database.type,
            db_version: dbVersion,
            timezone: this.globalConfig.generic.timezone,
            default_locale: this.globalConfig.defaultLocale,
            personalization_enabled: this.globalConfig.personalization.enabled,
            multi_main_setup_enabled: this.globalConfig.multiMainSetup.enabled,
            task_runners_mode: this.globalConfig.taskRunners.mode,
            templates_enabled: this.globalConfig.templates.enabled,
            ai_enabled: this.globalConfig.ai.enabled,
            license: {
                plan_name: this.license.getPlanName(),
                tenant_id: this.globalConfig.license.tenantId,
                auto_renewal_enabled: this.globalConfig.license.autoRenewalEnabled,
                has_activation_key: !!this.globalConfig.license.activationKey,
                expiry_date: this.license.getExpiryDate()?.toISOString(),
                termination_date: this.license.getTerminationDate()?.toISOString(),
                expiring_in_days: this.license.getExpiringInDays(),
                terminating_in_days: this.license.getTerminatingInDays(),
                features: this.getLicenseFeatures(),
            },
            smtp_set_up: this.globalConfig.userManagement.emails.mode === 'smtp',
            ldap_allowed: authenticationMethod === 'ldap',
            saml_enabled: authenticationMethod === 'saml',
        });
    }
    async getInstanceOwnerId() {
        if (!(await this.ownershipService.hasInstanceOwner()))
            return undefined;
        return (await this.ownershipService.getInstanceOwner()).id;
    }
    async getOtelTelemetryInfo() {
        const { OtelConfig } = await import('../../modules/otel/otel.config.js');
        const otelConfig = di_1.Container.get(OtelConfig);
        return {
            enabled: otelConfig.enabled,
            include_node_spans: otelConfig.includeNodeSpans,
        };
    }
    getSettingsManagedByEnvVarsTelemetryInfo() {
        const config = this.globalConfig.instanceSettingsLoader;
        return {
            owner_managed_by_env: config.ownerManagedByEnv,
            sso_managed_by_env: config.ssoManagedByEnv,
            security_policy_managed_by_env: config.securityPolicyManagedByEnv,
            log_streaming_managed_by_env: config.logStreamingManagedByEnv,
            mcp_managed_by_env: config.mcpManagedByEnv,
            community_packages_managed_by_env: config.communityPackagesManagedByEnv,
        };
    }
    getLicenseFeatures() {
        return {
            customRoles: this.licenseState.isCustomRolesLicensed(),
            dynamicCredentials: this.licenseState.isDynamicCredentialsLicensed(),
            personalSpacePolicy: this.licenseState.isPersonalSpacePolicyLicensed(),
            sharing: this.licenseState.isSharingLicensed(),
            logStreaming: this.licenseState.isLogStreamingLicensed(),
            ldap: this.licenseState.isLdapLicensed(),
            saml: this.licenseState.isSamlLicensed(),
            oidc: this.licenseState.isOidcLicensed(),
            mfaEnforcement: this.licenseState.isMFAEnforcementLicensed(),
            apiKeyScopes: this.licenseState.isApiKeyScopesLicensed(),
            aiAssistant: this.licenseState.isAiAssistantLicensed(),
            askAi: this.licenseState.isAskAiLicensed(),
            aiCredits: this.licenseState.isAiCreditsLicensed(),
            advancedExecutionFilters: this.licenseState.isAdvancedExecutionFiltersLicensed(),
            advancedPermissions: this.licenseState.isAdvancedPermissionsLicensed(),
            debugInEditor: this.licenseState.isDebugInEditorLicensed(),
            binaryDataS3: this.licenseState.isBinaryDataS3Licensed(),
            multiMain: this.licenseState.isMultiMainLicensed(),
            variables: this.licenseState.isVariablesLicensed(),
            sourceControl: this.licenseState.isSourceControlLicensed(),
            externalSecrets: this.licenseState.isExternalSecretsLicensed(),
            apiDisabled: this.licenseState.isAPIDisabled(),
            workerView: this.licenseState.isWorkerViewLicensed(),
            projectRoleAdmin: this.licenseState.isProjectRoleAdminLicensed(),
            projectRoleEditor: this.licenseState.isProjectRoleEditorLicensed(),
            projectRoleViewer: this.licenseState.isProjectRoleViewerLicensed(),
            customNpmRegistry: this.licenseState.isCustomNpmRegistryLicensed(),
            folders: this.licenseState.isFoldersLicensed(),
            insightsSummary: this.licenseState.isInsightsSummaryLicensed(),
            insightsDashboard: this.licenseState.isInsightsDashboardLicensed(),
            insightsHourlyData: this.licenseState.isInsightsHourlyDataLicensed(),
            workflowDiffs: this.licenseState.isWorkflowDiffsLicensed(),
            provisioning: this.licenseState.isProvisioningLicensed(),
            maxUsers: this.licenseState.getMaxUsers(),
            maxActiveWorkflows: this.licenseState.getMaxActiveWorkflows(),
            maxVariables: this.licenseState.getMaxVariables(),
            maxAiCredits: this.licenseState.getMaxAiCredits(),
            workflowHistoryPruneQuota: this.licenseState.getWorkflowHistoryPruneQuota(),
            insightsMaxHistory: this.licenseState.getInsightsMaxHistory(),
            insightsRetentionMaxAge: this.licenseState.getInsightsRetentionMaxAge(),
            insightsRetentionPruneInterval: this.licenseState.getInsightsRetentionPruneInterval(),
            maxTeamProjects: this.licenseState.getMaxTeamProjects(),
            maxWorkflowsWithEvaluations: this.licenseState.getMaxWorkflowsWithEvaluations(),
        };
    }
    sessionStarted({ pushRef }) {
        this.telemetry.track('Session started', { session_id: pushRef });
    }
    instanceStopped() {
        this.telemetry.track('User instance stopped');
    }
    runnerDisconnected({ reason, mode }) {
        this.telemetry.track(telemetry_1.TELEMETRY_EVENT.PLATFORM.TASK_RUNNER_DISCONNECTED, { reason, mode });
    }
    async instanceOwnerSetup({ userId }) {
        this.telemetry.groupIdentify({
            userId,
            postHog: { userId, traits: await this.getInstanceGroupFacts() },
        });
        this.telemetry.track('Owner finished instance setup', { user_id: userId });
    }
    firstProductionWorkflowSucceeded({ projectId, workflowId, userId, }) {
        this.telemetry.track('Workflow first prod success', {
            project_id: projectId,
            workflow_id: workflowId,
            user_id: userId ?? undefined,
        });
    }
    instanceFirstProductionWorkflowFailed({ projectId, workflowId, userId, }) {
        this.telemetry.track('Instance first prod failure', {
            project_id: projectId,
            workflow_id: workflowId,
            user_id: userId,
        });
    }
    firstWorkflowDataLoaded({ userId, workflowId, nodeType, nodeId, credentialType, credentialId, }) {
        this.telemetry.track('Workflow first data fetched', {
            user_id: userId,
            workflow_id: workflowId,
            node_type: nodeType,
            node_id: nodeId,
            credential_type: credentialType,
            credential_id: credentialId,
        });
    }
    userChangedRole({ userId, targetUserId, targetUserNewRole, publicApi, }) {
        this.telemetry.identify({
            user_role: targetUserNewRole,
        }, targetUserId);
        this.telemetry.track('User changed role', {
            user_id: userId,
            target_user_id: targetUserId,
            target_user_new_role: targetUserNewRole,
            public_api: publicApi,
        });
    }
    userRetrievedUser({ userId, publicApi }) {
        this.telemetry.track('User retrieved user', {
            user_id: userId,
            public_api: publicApi,
        });
    }
    userRetrievedAllUsers({ userId, publicApi }) {
        this.telemetry.track('User retrieved all users', {
            user_id: userId,
            public_api: publicApi,
        });
    }
    userRetrievedExecution({ userId, publicApi }) {
        this.telemetry.track('User retrieved execution', {
            user_id: userId,
            public_api: publicApi,
        });
    }
    userRetrievedAllExecutions({ userId, publicApi, }) {
        this.telemetry.track('User retrieved all executions', {
            user_id: userId,
            public_api: publicApi,
        });
    }
    userRetrievedWorkflow({ userId, publicApi }) {
        this.telemetry.track('User retrieved workflow', {
            user_id: userId,
            public_api: publicApi,
        });
    }
    userRetrievedWorkflowVersion({ userId, publicApi, }) {
        this.telemetry.track('User retrieved workflow version', {
            user_id: userId,
            public_api: publicApi,
        });
    }
    userRetrievedAllWorkflows({ userId, publicApi, }) {
        this.telemetry.track('User retrieved all workflows', {
            user_id: userId,
            public_api: publicApi,
        });
    }
    userUpdated({ user, fieldsChanged }) {
        this.telemetry.identify({
            user_role: user?.role?.slug,
            ...(this.globalConfig.deployment.type === 'cloud' && { user_email: user.email }),
        }, user.id);
        this.telemetry.track('User changed personal settings', {
            user_id: user.id,
            fields_changed: fieldsChanged,
        });
    }
    userDeleted({ user, publicApi, targetUserOldStatus, migrationStrategy, targetUserId, migrationUserId, }) {
        this.telemetry.track('User deleted user', {
            user_id: user.id,
            public_api: publicApi,
            target_user_old_status: targetUserOldStatus,
            migration_strategy: migrationStrategy,
            target_user_id: targetUserId,
            migration_user_id: migrationUserId,
        });
        this.telemetry.identify({
            deleted: true,
        }, targetUserId);
    }
    userInvited({ user, targetUserId, publicApi, emailSent, inviteeRole, }) {
        this.telemetry.track('User invited new user', {
            user_id: user.id,
            target_user_id: targetUserId,
            public_api: publicApi,
            email_sent: emailSent,
            invitee_role: inviteeRole,
        });
    }
    userSignedUp({ user, userType, wasDisabledLdapUser }) {
        const payload = {
            user_id: user.id,
            user_type: userType,
            was_disabled_ldap_user: wasDisabledLdapUser,
            ...(this.globalConfig.deployment.type === 'cloud' && {
                user_email: user.email,
                user_role: user?.role?.slug,
            }),
        };
        this.telemetry.identify(payload, user.id);
        this.telemetry.groupIdentify({
            userId: user.id,
        });
        this.telemetry.track('User signed up', payload);
    }
    userSubmittedPersonalizationSurvey({ userId, answers, }) {
        const personalizationSurveyData = { user_id: userId };
        for (const [camelCaseKey, value] of Object.entries(answers)) {
            if (value) {
                personalizationSurveyData[(0, change_case_1.snakeCase)(camelCaseKey)] = value;
            }
        }
        this.telemetry.track('User responded to personalization questions', personalizationSurveyData);
    }
    emailFailed({ user, messageType, publicApi }) {
        this.telemetry.track('Instance failed to send transactional email to user', {
            user_id: user.id,
            message_type: messageType,
            public_api: publicApi,
        });
    }
    userTransactionalEmailSent({ userId, messageType, publicApi, }) {
        this.telemetry.track('User sent transactional email', {
            user_id: userId,
            message_type: messageType,
            public_api: publicApi,
        });
    }
    detectIdentityExtractorChanges(previousWorkflow, currentWorkflow) {
        if (!previousWorkflow) {
            return this.hasIdentityExtractors(currentWorkflow.nodes);
        }
        const previousNodesMap = new Map();
        for (const node of previousWorkflow.nodes) {
            previousNodesMap.set(node.name, node);
        }
        for (const currentNode of currentWorkflow.nodes) {
            const previousNode = previousNodesMap.get(currentNode.name);
            if (!previousNode) {
                if (this.hasIdentityExtractors([currentNode])) {
                    return true;
                }
                continue;
            }
            const currentHooks = this.extractIdentityExtractorHooks(currentNode);
            const previousHooks = this.extractIdentityExtractorHooks(previousNode);
            if (JSON.stringify(currentHooks) !== JSON.stringify(previousHooks)) {
                return true;
            }
        }
        const currentNodesMap = new Map();
        for (const node of currentWorkflow.nodes) {
            currentNodesMap.set(node.name, node);
        }
        for (const previousNode of previousWorkflow.nodes) {
            if (!currentNodesMap.has(previousNode.name)) {
                if (this.hasIdentityExtractors([previousNode])) {
                    return true;
                }
            }
        }
        return false;
    }
    hasIdentityExtractors(nodes) {
        for (const node of nodes) {
            const hooks = this.extractIdentityExtractorHooks(node);
            if (hooks.length > 0) {
                return true;
            }
        }
        return false;
    }
    extractIdentityExtractorHooks(node) {
        const hookParamsResult = (0, n8n_workflow_1.toExecutionContextEstablishmentHookParameter)(node.parameters);
        if (!hookParamsResult || hookParamsResult.error || !hookParamsResult.data) {
            return [];
        }
        return hookParamsResult.data.contextEstablishmentHooks?.hooks ?? [];
    }
    userInviteEmailClick({ invitee }) {
        this.telemetry.track('User clicked invite link from email', {
            user_id: invitee.id,
        });
    }
    userPasswordResetEmailClick({ user }) {
        this.telemetry.track('User clicked password reset link from email', {
            user_id: user.id,
        });
    }
    userPasswordResetRequestClick({ user, }) {
        this.telemetry.track('User requested password reset while logged out', {
            user_id: user.id,
        });
    }
    migrationReportViewed({ user, targetVersion, refreshed, report, }) {
        this.telemetry.track(telemetry_1.TELEMETRY_EVENT.MIGRATION_REPORT.USER_VIEWED_MIGRATION_REPORT, {
            user_id: user.id,
            target_version: targetVersion,
            refreshed,
            total_workflows: report.totalWorkflows,
            affected_workflows: report.totalAffectedWorkflows,
            affected_instance_rules: report.report.instanceResults.length,
            rules: report.report.workflowResults.map((rule) => ({
                rule_id: rule.ruleId,
                impact: rule.ruleImpact,
                affected_workflows: rule.nbAffectedWorkflows,
            })),
            synced_at: report.report.generatedAt
                ? new Date(report.report.generatedAt).toISOString()
                : undefined,
        });
    }
    historyCompacted({ workflowsProcessed, totalVersionsSeen, totalVersionsDeleted, compactionStartTime, windowEndIso, windowStartIso, durationMs, errorCount, }) {
        this.telemetry.track('Instance compacted workflow history', {
            workflows_processed: workflowsProcessed,
            total_versions_seen: totalVersionsSeen,
            total_versions_deleted: totalVersionsDeleted,
            window_start_iso: new Date(windowStartIso),
            window_end_iso: new Date(windowEndIso),
            error_count: errorCount,
            compaction_start_time_iso: compactionStartTime,
            compaction_duration_ms: durationMs,
            compaction_batch_delay_ms: this.globalConfig.workflowHistoryCompaction.batchDelayMs,
            compaction_batch_size: this.globalConfig.workflowHistoryCompaction.batchSize,
            compaction_trimming_optimizing_time_window_hours: this.globalConfig.workflowHistoryCompaction.optimizingTimeWindowHours,
            compaction_trimming_time_window_days: this.globalConfig.workflowHistoryCompaction.trimmingTimeWindowDays,
        });
    }
    instancePoliciesUpdated({ user, settingName, value, }) {
        this.telemetry.track('User updated instance policies', {
            user_id: user.id,
            [settingName]: value,
        });
    }
    executionDataRevealed({ user, executionId, workflowId, redactionPolicy, }) {
        this.telemetry.track('User confirmed reveal data', {
            user_id: user.id,
            execution_id: executionId,
            workflow_id: workflowId,
            redaction_policy: redactionPolicy,
        });
    }
    workflowReviewRequested({ user, workflowReviewRequestId, projectId, workflowId, workflowVersionId, reviewerCount, }) {
        this.telemetry.track(telemetry_1.TELEMETRY_EVENT.WORKFLOW_REVIEWS.USER_REQUESTED_WORKFLOW_REVIEW, {
            user_id: user.id,
            workflow_review_request_id: workflowReviewRequestId,
            project_id: projectId,
            workflow_id: workflowId,
            workflow_version_id: workflowVersionId,
            reviewer_count: reviewerCount,
        });
    }
    workflowReviewVersionUpdated({ user, workflowReviewRequestId, workflowId, workflowVersionId, }) {
        this.telemetry.track(telemetry_1.TELEMETRY_EVENT.WORKFLOW_REVIEWS.USER_UPDATED_WORKFLOW_VERSION_UNDER_REVIEW, {
            user_id: user.id,
            workflow_review_request_id: workflowReviewRequestId,
            workflow_id: workflowId,
            workflow_version_id: workflowVersionId,
        });
    }
    workflowReviewDecided({ user, workflowReviewRequestId, workflowId, workflowVersionId, decision, decidedVia, reviewCreatedAt, }) {
        this.telemetry.track(telemetry_1.TELEMETRY_EVENT.WORKFLOW_REVIEWS.USER_DECIDED_WORKFLOW_REVIEW, {
            user_id: user.id,
            workflow_review_request_id: workflowReviewRequestId,
            workflow_id: workflowId,
            workflow_version_id: workflowVersionId,
            decision,
            decided_via: decidedVia,
            review_created_at: reviewCreatedAt.toISOString(),
        });
    }
    workflowReviewClosed({ workflowReviewRequestId, cause, }) {
        this.telemetry.track(telemetry_1.TELEMETRY_EVENT.WORKFLOW_REVIEWS.WORKFLOW_REVIEW_CLOSED, {
            workflow_review_request_id: workflowReviewRequestId,
            cause_trigger: cause.trigger,
            cause_actor_kind: cause.actorKind,
        });
    }
    workflowReviewCommentCreated({ user, workflowReviewRequestId, }) {
        this.telemetry.track(telemetry_1.TELEMETRY_EVENT.WORKFLOW_REVIEWS.USER_COMMENTED_ON_WORKFLOW_REVIEW, {
            user_id: user.id,
            workflow_review_request_id: workflowReviewRequestId,
        });
    }
    customRoleCreated({ userId, roleSlug, scopes, source, }) {
        this.telemetry.track('User created custom role', {
            user_id: userId,
            role_slug: roleSlug,
            scopes,
            source,
        });
    }
    customRoleUpdated({ userId, roleSlug, scopes }) {
        this.telemetry.track('User updated custom role', {
            user_id: userId,
            role_slug: roleSlug,
            scopes,
        });
    }
    customRoleDeleted({ userId, roleSlug }) {
        this.telemetry.track('User deleted custom role', {
            user_id: userId,
            role_slug: roleSlug,
        });
    }
    serverCliImportCommand({ activeState, workflowCount, separate, }) {
        this.telemetry.track('User imported workflows via server cli', {
            active_state: activeState,
            workflow_count: workflowCount,
            separate,
        });
    }
    serverCliExportCommand({ selector, published, separate, backup, workflowCount, }) {
        this.telemetry.track('User exported workflows via server cli', {
            selector,
            published,
            separate,
            backup,
            workflow_count: workflowCount,
        });
    }
};
exports.TelemetryEventRelay = TelemetryEventRelay;
exports.TelemetryEventRelay = TelemetryEventRelay = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_services_1.EventService, telemetry_2.Telemetry, license_1.License, backend_common_1.LicenseState, config_1.GlobalConfig, n8n_core_1.InstanceSettings, n8n_core_1.BinaryDataConfig, db_1.WorkflowRepository, node_types_1.NodeTypes, db_1.SharedWorkflowRepository, db_1.ProjectRelationRepository, db_1.CredentialsRepository, dynamic_credentials_proxy_1.DynamicCredentialsProxy, db_1.DbConnection, load_nodes_and_credentials_1.LoadNodesAndCredentials, posthog_1.PostHogClient, ownership_service_1.OwnershipService])
], TelemetryEventRelay);
function getSemanticVersioning(versionCli) {
    try {
        const parsed = semver_1.default.parse(versionCli);
        if (!parsed) {
            return { major: null, minor: null, patch: null };
        }
        return {
            major: parsed.major,
            minor: parsed.minor,
            patch: parsed.patch,
        };
    }
    catch (e) {
        return { major: null, minor: null, patch: null };
    }
}
//# sourceMappingURL=telemetry.event-relay.js.map