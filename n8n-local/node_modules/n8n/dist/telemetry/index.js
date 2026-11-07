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
exports.Telemetry = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_network_1 = require("@n8n/backend-network");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const telemetry_1 = require("@n8n/telemetry");
const n8n_core_1 = require("n8n-core");
const constants_1 = require("../constants");
const license_1 = require("../license");
const posthog_1 = require("../posthog");
const source_control_preferences_service_ee_1 = require("../modules/source-control.ee/source-control-preferences.service.ee");
const mcp_constants_1 = require("../modules/mcp/mcp.constants");
let Telemetry = class Telemetry {
    constructor(logger, postHog, license, instanceSettings, workflowRepository, globalConfig, errorReporter, outboundHttp) {
        this.logger = logger;
        this.postHog = postHog;
        this.license = license;
        this.instanceSettings = instanceSettings;
        this.workflowRepository = workflowRepository;
        this.globalConfig = globalConfig;
        this.errorReporter = errorReporter;
        this.outboundHttp = outboundHttp;
        this.executionCountsBuffer = {};
        this.apiInvocationsBuffer = {};
        this.agentExecutionCountsBuffer = {};
        this.agentSessionMetricsBuffer = {};
        this.eventsMissingUserId = new Set();
    }
    sanitizeTelemetryProperties(obj, depth = 0, maxDepth = 10) {
        try {
            const result = {};
            for (const [key, value] of Object.entries(obj)) {
                if (value === null || value === undefined) {
                    continue;
                }
                else if (typeof value === 'boolean') {
                    result[key] = value ? 'true' : 'false';
                }
                else if (typeof value === 'number') {
                    result[key] = value;
                }
                else if (typeof value === 'string') {
                    result[key] = value;
                }
                else if (Array.isArray(value)) {
                    result[key] = JSON.stringify(value);
                }
                else if (typeof value === 'object' && value.constructor === Object) {
                    if (depth >= maxDepth) {
                        result[key] = JSON.stringify(value);
                    }
                    else {
                        Object.assign(result, this.sanitizeTelemetryProperties(value, depth + 1, maxDepth));
                    }
                }
                else {
                    continue;
                }
            }
            return result;
        }
        catch (e) {
            this.logger.error('Error sanitizing telemetry properties', { error: e, object: obj });
            return {};
        }
    }
    async init() {
        const { enabled, backendConfig } = this.globalConfig.diagnostics;
        if (enabled) {
            const [key, dataPlaneUrl] = backendConfig.split(';');
            if (!key || !dataPlaneUrl) {
                this.logger.warn('Diagnostics backend config is invalid');
                return;
            }
            const logLevel = this.globalConfig.logging.level;
            const { default: RudderStack } = await import('@rudderstack/rudder-sdk-node');
            const { httpAgent, httpsAgent } = this.outboundHttp
                .transport({
                useDefaultSsrfPolicy: 'unsafe',
            })
                .getNodeAgent();
            const axiosConfig = {
                httpAgent,
                httpsAgent,
                headers: { 'Content-Type': 'application/json' },
            };
            this.rudderStack = new RudderStack(key, {
                axiosConfig,
                logLevel,
                dataPlaneUrl,
                gzip: false,
                errorHandler: (error) => {
                    this.errorReporter.error(error);
                },
            });
        }
    }
    flushBuffers() {
        if (!this.rudderStack) {
            return;
        }
        this.flushWorkflowExecutionCounts();
        this.flushAgentExecutionCounts();
        this.flushAgentSessionMetrics();
        this.flushApiInvocations();
    }
    async sendPulsePacket() {
        if (!this.rudderStack) {
            return;
        }
        const sourceControlPreferences = di_1.Container.get(source_control_preferences_service_ee_1.SourceControlPreferencesService).getPreferences();
        const pulsePacket = {
            plan_name_current: this.license.getPlanName(),
            quota: this.license.getTriggerLimit(),
            usage: await this.workflowRepository.getActiveTriggerCount(),
            role_count: await di_1.Container.get(db_1.UserRepository).countUsersByRole(),
            source_control_set_up: di_1.Container.get(source_control_preferences_service_ee_1.SourceControlPreferencesService).isSourceControlSetup(),
            branchName: sourceControlPreferences.branchName,
            read_only_instance: sourceControlPreferences.branchReadOnly,
            team_projects: (await di_1.Container.get(db_1.ProjectRepository).getProjectCounts()).team,
            project_role_count: await di_1.Container.get(db_1.ProjectRelationRepository).countUsersByRole(),
        };
        this.track('pulse', pulsePacket);
    }
    flushApiInvocations() {
        for (const userId of Object.keys(this.apiInvocationsBuffer)) {
            const entry = this.apiInvocationsBuffer[userId];
            if (entry.total_calls > 0) {
                this.track('Public API usage', {
                    user_id: userId,
                    total_calls: entry.total_calls,
                    first: entry.first,
                    endpoints: JSON.stringify(entry.endpoints),
                    user_agents: JSON.stringify(entry.user_agents),
                });
            }
        }
        this.apiInvocationsBuffer = {};
    }
    flushWorkflowExecutionCounts() {
        const workflowIdsToReport = Object.keys(this.executionCountsBuffer).filter((workflowId) => {
            const data = this.executionCountsBuffer[workflowId];
            const sum = (data.manual_error?.count ?? 0) +
                (data.manual_success?.count ?? 0) +
                (data.prod_error?.count ?? 0) +
                (data.prod_success?.count ?? 0) +
                (data.manual_crashed?.count ?? 0) +
                (data.prod_crashed?.count ?? 0);
            return sum > 0;
        });
        for (const workflowId of workflowIdsToReport) {
            this.track('Workflow execution count', {
                event_version: '2',
                workflow_id: workflowId,
                ...this.executionCountsBuffer[workflowId],
            });
        }
        this.executionCountsBuffer = {};
    }
    getAgentExecutionCountsBufferKey(agentId, runType, userId) {
        return userId ? `${agentId}:${runType}:${userId}` : `${agentId}:${runType}`;
    }
    flushAgentExecutionCounts() {
        const keysToReport = Object.keys(this.agentExecutionCountsBuffer).filter((bufferKey) => {
            const data = this.agentExecutionCountsBuffer[bufferKey];
            return data.message_count + data.token_count + data.tool_call_count > 0;
        });
        for (const bufferKey of keysToReport) {
            const { agent_id, user_id, run_type, ...counts } = this.agentExecutionCountsBuffer[bufferKey];
            this.track(telemetry_1.TELEMETRY_EVENT.AGENTS.AGENT_EXECUTION_COUNT, {
                event_version: '3',
                agent_id,
                ...(user_id ? { user_id } : {}),
                run_type,
                ...counts,
            });
        }
        this.agentExecutionCountsBuffer = {};
    }
    getAgentSessionMetricsBufferKey(properties) {
        return [
            properties.agent_id,
            properties.user_id,
            properties.run_type,
            properties.turn_status,
            JSON.stringify(properties.configuration),
        ].join(':');
    }
    flushAgentSessionMetrics() {
        for (const bucket of Object.values(this.agentSessionMetricsBuffer)) {
            if (Object.keys(bucket.sessions).length === 0)
                continue;
            this.track(telemetry_1.TELEMETRY_EVENT.AGENTS.AGENT_SESSION_METRICS, {
                event_version: '1',
                agent_id: bucket.agent_id,
                ...(bucket.user_id ? { user_id: bucket.user_id } : {}),
                ...(bucket.agent_type ? { agent_type: bucket.agent_type } : {}),
                ...bucket.configuration,
                run_type: bucket.run_type,
                turn_status: bucket.turn_status,
                ...this.sumAgentSessionMetrics(bucket.sessions),
                counts_by_source: Object.fromEntries(Object.entries(bucket.sessions_by_source).map(([source, sessions]) => [
                    source,
                    this.sumAgentSessionMetrics(sessions),
                ])),
            });
        }
        this.agentSessionMetricsBuffer = {};
    }
    sumAgentSessionMetrics(sessionsById) {
        const sessions = Object.values(sessionsById);
        return {
            session_count: sessions.length,
            turn_count: sessions.reduce((total, session) => total + session.turn_count, 0),
            latency_ms_sum: sessions.reduce((total, session) => total + session.latency_ms, 0),
            cost_sum: sessions.reduce((total, session) => total + session.cost, 0),
            token_count_sum: sessions.reduce((total, session) => total + session.token_count, 0),
            tool_call_count_sum: sessions.reduce((total, session) => total + session.tool_call_count, 0),
            num_skills_sum: sessions.reduce((total, session) => total + session.num_skills, 0),
        };
    }
    trackWorkflowExecution(properties) {
        if (this.rudderStack) {
            const execTime = new Date();
            const workflowId = properties.workflow_id;
            this.executionCountsBuffer[workflowId] = this.executionCountsBuffer[workflowId] ?? {
                user_id: properties.user_id,
            };
            let key;
            if (properties.crashed) {
                key = `${properties.is_manual ? 'manual' : 'prod'}_crashed`;
            }
            else {
                key = `${properties.is_manual ? 'manual' : 'prod'}_${properties.success ? 'success' : 'error'}`;
            }
            this.addExecutionTrackData(workflowId, key, execTime);
            const executionStatus = properties.crashed
                ? 'crashed'
                : properties.success
                    ? 'success'
                    : 'error';
            const executionMode = properties.is_manual ? 'manual' : 'prod';
            if (properties.execution_source === 'instance_ai') {
                const instanceAiDataType = properties.mock_data_sources ? 'mock' : 'real';
                const sourceKey = `instance_ai_${instanceAiDataType}_${executionMode}_${executionStatus}`;
                this.addExecutionTrackData(workflowId, sourceKey, execTime);
            }
            if (properties.used_end_user_credentials) {
                this.track('Workflow execution with end-user credentials', properties);
            }
            if (!properties.success &&
                properties.is_manual &&
                properties.error_node_type?.startsWith('n8n-nodes-base')) {
                this.track('Workflow execution errored', properties);
            }
        }
    }
    addExecutionTrackData(workflowId, key, execTime) {
        const executionTrackData = this.executionCountsBuffer[workflowId][key];
        if (!executionTrackData) {
            this.executionCountsBuffer[workflowId][key] = {
                count: 1,
                first: execTime,
            };
        }
        else {
            executionTrackData.count++;
        }
    }
    trackAgentExecution(properties) {
        if (!this.rudderStack)
            return;
        const { agent_id, user_id, run_type, message_count = 0, token_count = 0, tool_call_count = 0, } = properties;
        const bufferKey = this.getAgentExecutionCountsBufferKey(agent_id, run_type, user_id);
        this.agentExecutionCountsBuffer[bufferKey] = this.agentExecutionCountsBuffer[bufferKey] ?? {
            agent_id,
            ...(user_id ? { user_id } : {}),
            run_type,
            message_count: 0,
            token_count: 0,
            tool_call_count: 0,
            counts_by_source: {},
        };
        const agentExecutionCounts = this.agentExecutionCountsBuffer[bufferKey];
        if (message_count > 0) {
            agentExecutionCounts.first_message_at ??= new Date().toISOString();
        }
        agentExecutionCounts.message_count += message_count;
        agentExecutionCounts.token_count += token_count;
        agentExecutionCounts.tool_call_count += tool_call_count;
        const source = properties.source || 'unknown';
        const sourceCounts = (agentExecutionCounts.counts_by_source[source] ??= {
            message_count: 0,
            token_count: 0,
            tool_call_count: 0,
        });
        sourceCounts.message_count += message_count;
        sourceCounts.token_count += token_count;
        sourceCounts.tool_call_count += tool_call_count;
    }
    trackAgentTurnFinished(properties) {
        if (!this.rudderStack)
            return;
        const bufferKey = this.getAgentSessionMetricsBufferKey(properties);
        this.agentSessionMetricsBuffer[bufferKey] = this.agentSessionMetricsBuffer[bufferKey] ?? {
            agent_id: properties.agent_id,
            user_id: properties.user_id,
            agent_type: properties.agent_type,
            run_type: properties.run_type,
            turn_status: properties.turn_status,
            configuration: properties.configuration,
            sessions: {},
            sessions_by_source: {},
        };
        const bucket = this.agentSessionMetricsBuffer[bufferKey];
        const source = properties.source || 'unknown';
        const sourceSessions = (bucket.sessions_by_source[source] ??= {});
        for (const sessions of [bucket.sessions, sourceSessions]) {
            const session = sessions[properties.thread_id] ?? {
                latency_ms: 0,
                cost: 0,
                token_count: 0,
                tool_call_count: 0,
                num_skills: properties.configuration.num_skills,
                turn_count: 0,
            };
            session.latency_ms += properties.latency_ms;
            session.cost += properties.cost;
            session.token_count += properties.token_count;
            session.tool_call_count += properties.tool_call_count;
            session.turn_count++;
            sessions[properties.thread_id] = session;
        }
    }
    trackApiInvocation(properties) {
        if (!this.rudderStack)
            return;
        const { user_id, path, method, user_agent } = properties;
        this.apiInvocationsBuffer[user_id] = this.apiInvocationsBuffer[user_id] ?? {
            total_calls: 0,
            first: new Date(),
            endpoints: {},
            user_agents: {},
        };
        const entry = this.apiInvocationsBuffer[user_id];
        entry.total_calls++;
        const endpointKey = `${method} ${path}`;
        entry.endpoints[endpointKey] = (entry.endpoints[endpointKey] ?? 0) + 1;
        if (user_agent) {
            entry.user_agents[user_agent] = (entry.user_agents[user_agent] ?? 0) + 1;
        }
    }
    async stopTracking() {
        await Promise.all([this.postHog.stop(), this.rudderStack?.flush()]);
    }
    groupIdentify({ userId, traits, postHog = { userId, traits }, }) {
        const { instanceId } = this.instanceSettings;
        if (!instanceId)
            return;
        if (this.postHog && postHog.userId) {
            this.postHog.groupIdentify({
                distinctId: `${instanceId}#${postHog.userId}`,
                instanceId,
                properties: postHog.traits,
            });
        }
        if (this.rudderStack) {
            this.rudderStack.group({
                groupId: instanceId,
                userId: userId ? `${instanceId}#${userId}` : instanceId,
                traits,
                context: {
                    ip: '0.0.0.0',
                },
            });
        }
    }
    identify(traits, userId) {
        const { instanceId } = this.instanceSettings;
        if (!instanceId)
            return;
        if (this.rudderStack) {
            this.rudderStack.identify({
                userId: userId ? `${instanceId}#${userId}` : instanceId,
                traits: { ...traits, instanceId },
                context: {
                    ip: '0.0.0.0',
                },
            });
        }
        if (this.postHog && userId) {
            this.postHog.identify({
                distinctId: `${instanceId}#${userId}`,
                properties: traits,
            });
        }
    }
    setUserCloudId(userCloudId) {
        this.userCloudId = userCloudId;
    }
    track(event, properties = {}) {
        const eventName = typeof event === 'string' ? event : event.name;
        if (typeof event !== 'string') {
            const validationError = event.getValidationError(properties);
            if (validationError)
                this.logger.warn(validationError);
        }
        if (!this.rudderStack) {
            return;
        }
        const { instanceId } = this.instanceSettings;
        const { user_id } = properties;
        const updatedProperties = {
            ...(eventName === mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT
                ? (0, telemetry_1.redactTelemetryProperties)(properties)
                : properties),
            instance_id: instanceId,
            user_id: user_id ?? undefined,
            version_cli: constants_1.N8N_VERSION,
        };
        const payload = {
            userId: `${instanceId}${user_id ? `#${user_id}` : ''}`,
            event: eventName,
            properties: updatedProperties,
            context: this.userCloudId ? { traits: { user_cloud_id: this.userCloudId } } : {},
        };
        const rudderStackPayload = {
            ...payload,
            context: { ...payload.context, ip: '0.0.0.0' },
        };
        const payloadSize = Buffer.byteLength(JSON.stringify(rudderStackPayload), 'utf8');
        const maxPayloadSize = 32 << 10;
        if (payloadSize > maxPayloadSize) {
            return;
        }
        if (typeof event !== 'string' && !user_id) {
            this.warnAboutMissingUserId(eventName);
        }
        this.postHog?.track(payload);
        return this.rudderStack.track(rudderStackPayload);
    }
    warnAboutMissingUserId(eventName) {
        if (this.eventsMissingUserId.has(eventName))
            return;
        this.eventsMissingUserId.add(eventName);
        this.logger.warn(`Telemetry event "${eventName}" carries no user_id, so PostHog drops it. Pass user_id in the event properties at the emit site.`);
    }
    getCountsBuffer() {
        return this.executionCountsBuffer;
    }
    getApiInvocationsBuffer() {
        return this.apiInvocationsBuffer;
    }
    getAgentExecutionCountsBuffer() {
        return this.agentExecutionCountsBuffer;
    }
    getAgentSessionMetricsBuffer() {
        return this.agentSessionMetricsBuffer;
    }
};
exports.Telemetry = Telemetry;
__decorate([
    (0, decorators_1.OnShutdown)(constants_1.LOWEST_SHUTDOWN_PRIORITY),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Telemetry.prototype, "stopTracking", null);
exports.Telemetry = Telemetry = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, posthog_1.PostHogClient, license_1.License, n8n_core_1.InstanceSettings, db_1.WorkflowRepository, config_1.GlobalConfig, n8n_core_1.ErrorReporter, backend_network_1.OutboundHttp])
], Telemetry);
//# sourceMappingURL=index.js.map