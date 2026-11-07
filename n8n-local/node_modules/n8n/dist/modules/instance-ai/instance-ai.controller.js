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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstanceAiController = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const decorators_1 = require("@n8n/decorators");
const permissions_1 = require("@n8n/permissions");
const instance_ai_1 = require("@n8n/instance-ai");
const parsers_1 = require("@n8n/instance-ai/parsers");
const node_crypto_1 = require("node:crypto");
const instance_ai_browser_session_service_1 = require("./browser/instance-ai-browser-session.service");
const agent_execution_service_1 = require("./eval/agent-execution.service");
const execution_service_1 = require("./eval/execution.service");
const thread_credential_allowlist_service_1 = require("./eval/thread-credential-allowlist.service");
const thread_restore_service_1 = require("./eval/thread-restore.service");
const durable_event_log_1 = require("./event-bus/durable-event-log");
const durable_log_metrics_1 = require("./event-bus/durable-log-metrics");
const in_process_event_bus_1 = require("./event-bus/in-process-event-bus");
const instance_ai_error_reporter_service_1 = require("./instance-ai-error-reporter.service");
const instance_ai_gateway_service_1 = require("./instance-ai-gateway.service");
const instance_ai_memory_service_1 = require("./instance-ai-memory.service");
const instance_ai_model_catalog_service_1 = require("./instance-ai-model-catalog.service");
const instance_ai_pending_agent_service_1 = require("./instance-ai-pending-agent.service");
const instance_ai_preference_card_service_1 = require("./instance-ai-preference-card.service");
const instance_ai_settings_service_1 = require("./instance-ai-settings.service");
const instance_ai_thread_tabs_service_1 = require("./instance-ai-thread-tabs.service");
const instance_ai_verification_service_1 = require("./instance-ai-verification.service");
const instance_ai_service_1 = require("./instance-ai.service");
const onboarding_1 = require("./onboarding");
const credentials_service_1 = require("../../credentials/credentials.service");
const errors_1 = require("@n8n/errors");
const push_1 = require("../../push");
const publisher_service_1 = require("../../scaling/pubsub/publisher.service");
const project_service_ee_1 = require("../../services/project.service.ee");
const backend_services_1 = require("@n8n/backend-services");
const KEEP_ALIVE_INTERVAL_MS = 15_000;
let InstanceAiController = class InstanceAiController {
    constructor(instanceAiService, gatewayService, browserSessionService, memoryService, onboarding, pendingAgentService, settingsService, modelCatalogService, evalExecutionService, evalAgentExecutionService, evalCredentialAllowlists, evalThreadRestore, eventBus, eventLog, durableLogMetrics, moduleRegistry, push, urlService, userRepository, credentialsService, projectService, instanceAiErrorReporter, publisher, preferenceCardService, globalConfig, threadTabsService) {
        this.instanceAiService = instanceAiService;
        this.gatewayService = gatewayService;
        this.browserSessionService = browserSessionService;
        this.memoryService = memoryService;
        this.onboarding = onboarding;
        this.pendingAgentService = pendingAgentService;
        this.settingsService = settingsService;
        this.modelCatalogService = modelCatalogService;
        this.evalExecutionService = evalExecutionService;
        this.evalAgentExecutionService = evalAgentExecutionService;
        this.evalCredentialAllowlists = evalCredentialAllowlists;
        this.evalThreadRestore = evalThreadRestore;
        this.eventBus = eventBus;
        this.eventLog = eventLog;
        this.durableLogMetrics = durableLogMetrics;
        this.moduleRegistry = moduleRegistry;
        this.push = push;
        this.urlService = urlService;
        this.userRepository = userRepository;
        this.credentialsService = credentialsService;
        this.projectService = projectService;
        this.instanceAiErrorReporter = instanceAiErrorReporter;
        this.publisher = publisher;
        this.preferenceCardService = preferenceCardService;
        this.threadTabsService = threadTabsService;
        this.gatewayApiKey = globalConfig.instanceAi.gatewayApiKey;
        this.instanceAiConfig = globalConfig.instanceAi;
    }
    requireInstanceAiEnabled() {
        if (!this.settingsService.isInstanceAiEnabled()) {
            throw new errors_1.ForbiddenError('Instance AI is disabled');
        }
    }
    async requireModelConfigured() {
        if (!(await this.settingsService.isModelConfigured())) {
            throw new errors_1.BadRequestError('The n8n Assistant has no model configured. An instance owner can add one in Settings > Assistant.');
        }
    }
    requireRunDebugEnabled() {
        if (!this.instanceAiService.isRunDebugEnabled()) {
            throw new errors_1.NotFoundError('Run debug is not enabled');
        }
    }
    stripBrotli(req, _res, next) {
        const ae = req.headers['accept-encoding'];
        if (typeof ae === 'string' && ae.includes('br')) {
            req.headers['accept-encoding'] = ae.replace(/\bbr\b,?\s*/g, '').replace(/,\s*$/, '');
        }
        next();
    }
    async chat(req, _res, threadId, payload) {
        this.requireInstanceAiEnabled();
        await this.requireModelConfigured();
        if (!payload.message && (!payload.attachments || payload.attachments.length === 0)) {
            throw new errors_1.BadRequestError('Either message or attachments must be provided');
        }
        await this.assertThreadAccess(req.user.id, threadId, { allowNew: true });
        const fileAttachments = (payload.attachments ?? []).filter((attachment) => attachment.type === 'file');
        if (fileAttachments.length > 0) {
            try {
                (0, parsers_1.validateAttachmentMimeTypes)(fileAttachments);
                (0, parsers_1.validateAttachmentSizes)(fileAttachments);
            }
            catch (error) {
                if (error instanceof parsers_1.UnsupportedAttachmentError) {
                    const summary = error.unsupported.map((u) => `${u.fileName} (${u.mimeType})`).join(', ');
                    throw new errors_1.BadRequestError(`Unsupported attachment type: ${summary}. Supported types include CSV, JSON, ` +
                        'PDF, DOCX, XLSX, HTML, plain text, markdown, and images.');
                }
                if (error instanceof parsers_1.OversizedAttachmentError) {
                    throw new errors_1.BadRequestError(error.reason === 'per_file'
                        ? `${error.message} Attach a smaller version, or resize the image before sending.`
                        : `${error.message} Send them across separate messages, or attach smaller versions.`);
                }
                throw error;
            }
        }
        if (this.instanceAiService.hasActiveRun(threadId)) {
            throw new errors_1.ConflictError('A run is already active for this thread');
        }
        if (payload.observerThresholdTokens !== undefined &&
            !(0, permissions_1.hasGlobalScope)(req.user, 'instanceAi:eval')) {
            throw new errors_1.ForbiddenError('observerThresholdTokens requires the instanceAi:eval scope');
        }
        const runId = this.instanceAiService.startRun(req.user, threadId, payload.message, payload.attachments, payload.context, payload.timeZone, payload.pushRef, payload.mode, payload.promptVersion, payload.computerUseChannels, payload.threadArtifacts, payload.observerThresholdTokens);
        return { runId };
    }
    async events(req, res, threadId, query) {
        this.requireInstanceAiEnabled();
        const ownership = await this.memoryService.checkThreadOwnership(req.user.id, threadId);
        if (ownership === 'other_user') {
            throw new errors_1.ForbiddenError('Not authorized for this thread');
        }
        let ownershipVerified = ownership === 'owned';
        let ownershipCheckInFlight = false;
        const pendingEvents = [];
        const userId = req.user.id;
        let bootstrapping = true;
        const deliver = (stored) => {
            if (ownershipVerified) {
                this.writeSseEvent(res, stored);
                return;
            }
            pendingEvents.push(stored);
            if (ownershipCheckInFlight)
                return;
            ownershipCheckInFlight = true;
            void this.memoryService
                .checkThreadOwnership(userId, threadId)
                .then((currentOwnership) => {
                if (currentOwnership === 'other_user') {
                    res.end();
                    return;
                }
                ownershipVerified = true;
                for (const buffered of pendingEvents) {
                    this.writeSseEvent(res, buffered);
                }
                pendingEvents.length = 0;
            })
                .catch(() => {
                pendingEvents.length = 0;
                res.end();
            });
        };
        const unsubscribe = this.eventBus.subscribe(threadId, (stored) => {
            if (bootstrapping)
                return;
            deliver(stored);
        });
        let closed = false;
        let keepAlive = undefined;
        const cleanup = () => {
            closed = true;
            unsubscribe();
            if (keepAlive !== undefined)
                clearInterval(keepAlive);
        };
        req.once('close', cleanup);
        res.once('finish', cleanup);
        if (ownership === 'owned') {
            await this.instanceAiService.replayUndeliveredTerminalOutcomes(threadId);
        }
        res.compress = false;
        res.setHeader('Content-Type', 'text/event-stream; charset=UTF-8');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders();
        const headerValue = req.headers['last-event-id'];
        const parsedHeader = headerValue ? parseInt(String(headerValue), 10) : NaN;
        const cursor = Number.isFinite(parsedHeader) && parsedHeader >= 0 ? parsedHeader : (query.lastEventId ?? 0);
        const threadStatus = this.instanceAiService.getThreadStatus(threadId);
        const liveGroups = new Map();
        if (threadStatus.hasActiveRun || threadStatus.isSuspended) {
            const groupId = this.instanceAiService.getMessageGroupId(threadId);
            if (groupId) {
                liveGroups.set(groupId, {
                    runIds: this.instanceAiService.getRunIdsForMessageGroup(groupId),
                    status: threadStatus.hasActiveRun ? 'active' : 'suspended',
                });
            }
        }
        for (const task of threadStatus.backgroundTasks) {
            if (task.status !== 'running' || !task.messageGroupId)
                continue;
            if (!liveGroups.has(task.messageGroupId)) {
                liveGroups.set(task.messageGroupId, {
                    runIds: this.instanceAiService.getRunIdsForMessageGroup(task.messageGroupId),
                    status: 'background',
                });
            }
        }
        const writeRunSyncFrame = async (groupId, group, runEvents) => {
            if (runEvents.length === 0)
                return;
            const agentTree = (0, instance_ai_1.buildAgentTreeFromEvents)(runEvents);
            await this.memoryService.flagExpiredConfirmations([{ agentTree }]);
            if (closed)
                return;
            res.write(`event: run-sync\ndata: ${JSON.stringify({
                runId: group.runIds.at(-1),
                messageGroupId: groupId,
                runIds: group.runIds,
                agentTree,
                status: group.status,
                backgroundTasks: threadStatus.backgroundTasks,
            })}\n\n`);
        };
        const arrivedDuringReplay = [];
        const stopBuffering = this.eventBus.subscribe(threadId, (stored) => {
            arrivedDuringReplay.push(stored);
        });
        try {
            const missed = await this.eventLog.getEventsAfter(threadId, cursor);
            if (closed)
                return;
            let lastReplayedSeq = cursor;
            for (const stored of missed) {
                deliver(stored);
                if (stored.id !== undefined)
                    lastReplayedSeq = stored.id;
            }
            const blockKey = (event) => `${event.type}:${event.runId}:${event.agentId}:${event.responseId ?? ''}:${event.payload.text}`;
            const foldedBlockKeys = new Set();
            for (const [groupId, group] of liveGroups) {
                const runEvents = await this.eventLog.getEventsForRuns(threadId, group.runIds);
                if (closed)
                    return;
                await writeRunSyncFrame(groupId, group, runEvents);
                for (const event of runEvents) {
                    if (event.type === 'text-block' || event.type === 'reasoning-block') {
                        foldedBlockKeys.add(blockKey(event));
                    }
                }
            }
            const gapRows = await this.eventLog.getEventsAfter(threadId, lastReplayedSeq);
            if (closed)
                return;
            const openSegments = this.eventLog.getOpenSegments(threadId);
            const segmentKey = (kind, event) => `${kind}:${event.runId}:${event.agentId}:${event.responseId ?? ''}`;
            const served = new Set(openSegments.map((segment) => segmentKey(segment.kind, segment)));
            const gapBlockSegments = new Set();
            for (const row of gapRows) {
                if (row.id === undefined || row.id <= lastReplayedSeq)
                    continue;
                const { event } = row;
                if (event.type === 'text-block' || event.type === 'reasoning-block') {
                    gapBlockSegments.add(segmentKey(event.type === 'text-block' ? 'text' : 'reasoning', event));
                    if (foldedBlockKeys.has(blockKey(event))) {
                        lastReplayedSeq = row.id;
                        continue;
                    }
                }
                deliver(row);
                lastReplayedSeq = row.id;
            }
            for (const stored of arrivedDuringReplay) {
                if (stored.id !== undefined) {
                    if (stored.id <= lastReplayedSeq)
                        continue;
                    if (stored.id === lastReplayedSeq + 1) {
                        deliver(stored);
                        lastReplayedSeq = stored.id;
                        continue;
                    }
                    deliver({ event: stored.event });
                    continue;
                }
                const { event } = stored;
                if ((event.type === 'text-delta' || event.type === 'reasoning-delta') &&
                    (served.has(segmentKey(event.type === 'text-delta' ? 'text' : 'reasoning', event)) ||
                        gapBlockSegments.has(segmentKey(event.type === 'text-delta' ? 'text' : 'reasoning', event)))) {
                    continue;
                }
                deliver(stored);
            }
            for (const segment of openSegments) {
                deliver({
                    event: {
                        type: segment.kind === 'text' ? 'text-delta' : 'reasoning-delta',
                        runId: segment.runId,
                        agentId: segment.agentId,
                        ...(segment.responseId ? { responseId: segment.responseId } : {}),
                        payload: { text: segment.text },
                    },
                });
            }
            this.durableLogMetrics.recordReplay(missed.length, Math.max(0, lastReplayedSeq - cursor));
        }
        finally {
            stopBuffering();
        }
        if (liveGroups.size > 0)
            res.flush?.();
        bootstrapping = false;
        keepAlive = setInterval(() => {
            res.write(': ping\n\n');
            res.flush?.();
        }, KEEP_ALIVE_INTERVAL_MS);
    }
    async confirm(req, _res, requestId) {
        this.requireInstanceAiEnabled();
        const parseResult = api_types_1.InstanceAiConfirmRequestDto.safeParse(req.body);
        if (!parseResult.success) {
            throw new errors_1.BadRequestError(parseResult.error.errors[0].message);
        }
        if ((0, onboarding_1.startsOnboardingFirstTurn)(requestId, parseResult.data)) {
            await this.requireModelConfigured();
        }
        const card = await this.onboarding.answerCard(req.user.id, requestId, parseResult.data);
        if (card) {
            const runId = 'firstMessage' in card
                ? this.instanceAiService.startRun(req.user, card.threadId, card.firstMessage)
                : card.runId;
            return { ok: true, runId };
        }
        const resolved = await this.instanceAiService.resolveConfirmation(req.user.id, requestId, parseResult.data);
        if (!resolved) {
            throw new errors_1.NotFoundError('Confirmation request not found or not authorized');
        }
        return resolved;
    }
    async cancel(req, _res, threadId) {
        this.requireInstanceAiEnabled();
        await this.assertThreadAccess(req.user.id, threadId);
        await this.instanceAiService.routeCancelRun(threadId);
        return { ok: true };
    }
    async feedback(req, _res, threadId, responseId, payload) {
        this.requireInstanceAiEnabled();
        await this.assertThreadAccess(req.user.id, threadId);
        void this.instanceAiService
            .submitLangsmithFeedback(req.user, threadId, responseId, payload)
            .catch(() => { });
        return { ok: true };
    }
    async cancelTask(req, _res, threadId, taskId) {
        this.requireInstanceAiEnabled();
        await this.assertThreadAccess(req.user.id, threadId);
        await this.instanceAiService.routeCancelBackgroundTask(threadId, taskId);
        return { ok: true };
    }
    async correctTask(req, _res, threadId, taskId, payload) {
        this.requireInstanceAiEnabled();
        await this.assertThreadAccess(req.user.id, threadId);
        await this.instanceAiService.routeCorrectionToTask(threadId, taskId, payload.message);
        return { ok: true };
    }
    async undoPreference(req, _res, threadId, preferenceId, payload) {
        this.requireInstanceAiEnabled();
        await this.assertThreadAccess(req.user.id, threadId);
        const event = await this.preferenceCardService.undo(req.user, threadId, preferenceId, payload);
        return { ok: true, event };
    }
    async editPreference(req, _res, threadId, preferenceId, payload) {
        this.requireInstanceAiEnabled();
        await this.assertThreadAccess(req.user.id, threadId);
        return await this.preferenceCardService.edit(req.user, threadId, preferenceId, payload);
    }
    async getCredits(req) {
        this.requireInstanceAiEnabled();
        return await this.instanceAiService.getCredits(req.user);
    }
    async getAdminSettings(_req) {
        return await this.settingsService.getAdminSettings();
    }
    async getModelCatalog(_req) {
        return await this.modelCatalogService.getModels();
    }
    async updateAdminSettings(req, _res, payload) {
        const result = await this.settingsService.updateAdminSettings(payload, req.user);
        const [publishResult] = await Promise.allSettled([
            this.publisher.publishCommand({ command: 'reload-instance-ai-settings' }),
            this.applyAdminSettingsSideEffects(result),
        ]);
        if (publishResult.status === 'rejected') {
            this.instanceAiErrorReporter.report(publishResult.reason, {
                component: 'settings-publish',
                threadId: 'admin-settings',
            });
        }
        return result;
    }
    async verifyModel(req, _res, payload) {
        return await di_1.Container.get(instance_ai_verification_service_1.InstanceAiVerificationService).verifyModel(req.user, payload);
    }
    async verifySandbox(req, _res, payload) {
        return await di_1.Container.get(instance_ai_verification_service_1.InstanceAiVerificationService).verifySandbox(req.user, payload);
    }
    async verifySearch(_req, _res, payload) {
        return await di_1.Container.get(instance_ai_verification_service_1.InstanceAiVerificationService).verifySearch(payload);
    }
    async reloadAdminSettings() {
        await this.settingsService.reloadFromDb();
        await this.applyAdminSettingsSideEffects({
            enabled: this.settingsService.isInstanceAiEnabled(),
            browserUseEnabled: this.settingsService.isBrowserUseEnabled(),
            localGatewayDisabled: this.settingsService.isLocalGatewayDisabled(),
        });
    }
    async applyAdminSettingsSideEffects(settings) {
        const sideEffects = [
            async () => {
                await this.moduleRegistry.refreshModuleSettings('instance-ai');
            },
            async () => {
                await this.moduleRegistry.refreshModuleSettings('agents');
            },
        ];
        if (!settings.enabled || !settings.browserUseEnabled) {
            sideEffects.push(async () => await this.browserSessionService.shutdown());
        }
        if (!settings.enabled || settings.localGatewayDisabled) {
            sideEffects.push(() => {
                const disconnectedUserIds = this.gatewayService.disconnectAllGateways();
                if (disconnectedUserIds.length === 0)
                    return;
                this.push.sendToUsers({
                    type: 'instanceAiGatewayStateChanged',
                    data: {
                        connected: false,
                        directory: null,
                        hostIdentifier: null,
                        toolCategories: [],
                    },
                }, disconnectedUserIds);
            });
        }
        const results = await Promise.allSettled(sideEffects.map(async (apply) => await apply()));
        for (const result of results) {
            if (result.status === 'rejected') {
                this.instanceAiErrorReporter.report(result.reason, {
                    component: 'settings-side-effects',
                    threadId: 'admin-settings',
                });
            }
        }
    }
    async getUserPreferences(req) {
        return await this.settingsService.getUserPreferences(req.user);
    }
    async updateUserPreferences(req, _res, payload) {
        const result = await this.settingsService.updateUserPreferences(req.user, payload);
        if (payload.localGatewayDisabled !== undefined) {
            await this.moduleRegistry.refreshModuleSettings('instance-ai');
        }
        return result;
    }
    async listServiceCredentials(_req) {
        return await this.settingsService.listInstanceServiceCredentials();
    }
    async listInstanceModelCredentials(_req) {
        return await this.settingsService.listInstanceModelCredentials();
    }
    async listThreads(req) {
        this.requireInstanceAiEnabled();
        return await this.memoryService.listThreads(req.user.id);
    }
    async listThreadHistory(req, _res, query) {
        this.requireInstanceAiEnabled();
        return await this.memoryService.listThreadHistory(req.user.id, query);
    }
    async getThread(req, _res, threadId) {
        this.requireInstanceAiEnabled();
        await this.assertThreadAccess(req.user.id, threadId);
        return { thread: await this.memoryService.getThreadInfo(threadId) };
    }
    async ensureThread(req, _res, payload) {
        this.requireInstanceAiEnabled();
        const project = await this.projectService.getProjectWithScope(req.user, payload.projectId, [
            'project:read',
        ]);
        if (!project) {
            throw new errors_1.ForbiddenError('You do not have access to the requested project');
        }
        const requestedThreadId = payload.threadId ?? (0, node_crypto_1.randomUUID)();
        await this.assertThreadAccess(req.user.id, requestedThreadId, { allowNew: true });
        const launchMetadata = {
            source: payload.source,
            origin: payload.origin ?? 'internal',
            sourceContext: payload.sourceContext,
        };
        try {
            return payload.source === 'onboarding'
                ? await this.onboarding.ensureThread(req.user, requestedThreadId, payload.projectId, launchMetadata)
                : await this.memoryService.ensureThread(req.user.id, requestedThreadId, payload.projectId, launchMetadata);
        }
        catch (error) {
            this.instanceAiErrorReporter.report(error, {
                component: 'instance-ai-ensure-thread',
                threadId: requestedThreadId,
                userId: req.user.id,
                projectId: payload.projectId,
            });
            throw error;
        }
    }
    async deleteThread(req, _res, threadId) {
        this.requireInstanceAiEnabled();
        await this.assertThreadAccess(req.user.id, threadId);
        await this.instanceAiService.routeClearThreadState(threadId, req.user.id);
        await this.memoryService.deleteThread(threadId);
        return { ok: true };
    }
    async renameThread(req, _res, threadId, payload) {
        this.requireInstanceAiEnabled();
        await this.assertThreadAccess(req.user.id, threadId);
        const thread = await this.memoryService.updateThread(threadId, {
            title: payload.title,
            metadata: payload.metadata,
        });
        return { thread };
    }
    async getThreadTabs(req, _res, threadId) {
        this.requireInstanceAiEnabled();
        await this.assertThreadAccess(req.user.id, threadId);
        return { state: await this.threadTabsService.getState(threadId, req.user.id) };
    }
    async saveThreadTabs(req, _res, threadId, payload) {
        this.requireInstanceAiEnabled();
        await this.assertThreadAccess(req.user.id, threadId);
        const state = { ...payload };
        await this.threadTabsService.saveState(threadId, req.user.id, state);
        return { state };
    }
    async persistPendingAgent(req, _res, threadId, payload) {
        this.requireInstanceAiEnabled();
        await this.assertThreadAccess(req.user.id, threadId);
        return await this.pendingAgentService.persistAndBind(req.user, threadId, payload);
    }
    async getThreadMessages(req, _res, threadId, query) {
        this.requireInstanceAiEnabled();
        await this.assertThreadAccess(req.user.id, threadId);
        await this.instanceAiService.replayUndeliveredTerminalOutcomes(threadId);
        if (query.raw === 'true') {
            return await this.memoryService.getThreadMessages(req.user.id, threadId, {
                limit: query.limit,
                page: query.page,
            });
        }
        const threadStatus = this.instanceAiService.getThreadStatus(threadId);
        const activeRunId = this.instanceAiService.getActiveRunId(threadId);
        const excludeRunIds = [];
        const excludeMessageGroupIds = [];
        if (activeRunId) {
            excludeRunIds.push(activeRunId);
            const activeGroupId = this.instanceAiService.getMessageGroupId(threadId);
            if (activeGroupId)
                excludeMessageGroupIds.push(activeGroupId);
        }
        for (const t of threadStatus.backgroundTasks) {
            if (t.status !== 'running')
                continue;
            if (t.runId)
                excludeRunIds.push(t.runId);
            if (t.messageGroupId)
                excludeMessageGroupIds.push(t.messageGroupId);
        }
        const result = await this.memoryService.getRichMessages(req.user.id, threadId, {
            limit: query.limit,
            page: query.page,
            excludeRunIds: excludeRunIds.length > 0 ? excludeRunIds : undefined,
            excludeMessageGroupIds: excludeMessageGroupIds.length > 0 ? excludeMessageGroupIds : undefined,
        });
        const nextEventId = await this.eventLog.getNextEventId(threadId);
        const appliedPreferences = await this.eventLog.getLastAppliedPreferences(threadId);
        return {
            ...result,
            nextEventId,
            ...(appliedPreferences ? { appliedPreferences } : {}),
        };
    }
    async getThreadStatus(req, _res, threadId) {
        this.requireInstanceAiEnabled();
        await this.assertThreadAccess(req.user.id, threadId, { allowNew: true });
        return this.instanceAiService.getThreadStatus(threadId);
    }
    async getRunDebug(req, _res, runId) {
        this.requireInstanceAiEnabled();
        this.requireRunDebugEnabled();
        const record = this.instanceAiService.getRunDebug(runId);
        if (!record) {
            throw new errors_1.NotFoundError('Run debug record not found');
        }
        await this.assertThreadAccess(req.user.id, record.threadId);
        return record;
    }
    async listThreadDebugRuns(req, _res, threadId) {
        this.requireInstanceAiEnabled();
        this.requireRunDebugEnabled();
        await this.assertThreadAccess(req.user.id, threadId);
        return {
            threadId,
            runs: this.instanceAiService.listThreadDebugRuns(threadId),
        };
    }
    async executeWithLlmMock(req, _res, workflowId, payload) {
        const { result, usage } = await (0, instance_ai_1.meterEvalUsage)(async () => await this.evalExecutionService.executeWithLlmMock(workflowId, req.user, payload));
        return { ...result, llmUsage: usage };
    }
    async executeAgentWithLlmMock(req, _res, agentId, payload) {
        const { result, usage } = await (0, instance_ai_1.meterEvalUsage)(async () => await this.evalAgentExecutionService.executeWithLlmMock(agentId, req.user, payload));
        return { ...result, llmUsage: usage };
    }
    async setThreadCredentialAllowlist(req, _res, payload) {
        this.requireInstanceAiEnabled();
        await this.assertThreadAccess(req.user.id, payload.threadId);
        this.evalCredentialAllowlists.set(payload.threadId, payload.credentialIds, payload.bypassCredentialTest);
        return { ok: true };
    }
    async setThreadCredentialTestTarget(req, _res, payload) {
        this.requireInstanceAiEnabled();
        if (!this.instanceAiConfig.evalInstance) {
            throw new errors_1.NotFoundError('Credential test targets are only available on an eval instance');
        }
        await this.assertThreadAccess(req.user.id, payload.threadId);
        const { threadId, ...target } = payload;
        this.evalCredentialAllowlists.setTestTarget(threadId, target);
        return { ok: true };
    }
    async getEvalThreadMemory(req, _res, threadId) {
        this.requireInstanceAiEnabled();
        await this.assertThreadAccess(req.user.id, threadId);
        return await this.instanceAiService.getThreadMemory(req.user.id, threadId);
    }
    async restoreEvalThread(req, _res, payload) {
        this.requireInstanceAiEnabled();
        await this.assertThreadAccess(req.user.id, payload.threadId);
        const projectId = await this.memoryService.getThreadProjectId(payload.threadId);
        if (!projectId) {
            throw new errors_1.BadRequestError('Thread is not bound to a project');
        }
        const workflows = payload.workflows ?? [];
        const agents = payload.agents ?? [];
        const folders = payload.folders ?? [];
        const unbacked = (0, api_types_1.findUnbackedSeedWorkflowTools)(payload);
        if (unbacked.length > 0) {
            throw new errors_1.BadRequestError(unbacked
                .map(({ agentId, target }) => `Seed agent ${agentId} has a workflow tool targeting ${JSON.stringify(target)}, which no seeded workflow's name matches`)
                .join('; '));
        }
        const folderIssues = (0, api_types_1.findSeedFolderIssues)({ folders, workflows });
        if (folderIssues.length > 0) {
            throw new errors_1.BadRequestError(folderIssues.join('; '));
        }
        const folderIdMap = await this.evalThreadRestore.restoreFolders(folders, projectId, req.user);
        const folderIds = folders.flatMap((folder) => {
            const id = folderIdMap.get(folder.id);
            return id === undefined ? [] : [id];
        });
        let restored = 0;
        let dataTableIds = [];
        let createdWorkflowIds = [];
        let publishedWorkflowIds = [];
        let createdAgentIds = [];
        let priorMetadata;
        let bindingWritten = false;
        const allowedCredentialIds = this.evalCredentialAllowlists.get(payload.threadId);
        try {
            const idMap = await this.evalThreadRestore.restoreDataTables(payload.dataTables ?? [], projectId, { uniquifyNames: payload.uniquifyNames ?? true });
            dataTableIds = [...idMap.values()];
            createdWorkflowIds = await this.evalThreadRestore.restoreWorkflows(workflows, projectId, req.user, idMap, allowedCredentialIds ? new Set(allowedCredentialIds) : undefined, folderIdMap);
            publishedWorkflowIds = await this.evalThreadRestore.publishSeedWorkflows(workflows, req.user);
            createdAgentIds = await this.evalThreadRestore.restoreAgents(agents, projectId, req.user, idMap, allowedCredentialIds ? new Set(allowedCredentialIds) : undefined);
            const binding = createdAgentIds.length > 0
                ? (0, instance_ai_1.seedAgentBuilderTargetMetadata)(agents.map((agent) => ({
                    agentId: agent.id,
                    projectId,
                    name: agent.config.name,
                    ref: agent.config.name,
                })), payload.messages)
                : undefined;
            if (binding) {
                priorMetadata = await this.memoryService.getThreadMetadata(req.user.id, payload.threadId);
                await this.memoryService.updateThread(payload.threadId, { metadata: binding });
                bindingWritten = true;
            }
            if (payload.messages.length > 0) {
                ({ restored } = await this.memoryService.restoreThreadMessages(req.user.id, payload.threadId, payload.messages));
            }
        }
        catch (error) {
            if (bindingWritten) {
                try {
                    await this.memoryService.updateThread(payload.threadId, {
                        metadata: (0, instance_ai_1.clearedAgentBuilderTargetMetadata)(priorMetadata),
                    });
                }
                catch {
                }
            }
            await this.evalThreadRestore.deleteAgents(createdAgentIds, projectId);
            await this.evalThreadRestore.unpublishWorkflows(publishedWorkflowIds);
            await this.evalThreadRestore.deleteWorkflows(createdWorkflowIds);
            await this.evalThreadRestore.deleteDataTables(dataTableIds, projectId);
            await this.evalThreadRestore.deleteFolders(folders, folderIdMap, projectId, req.user);
            throw error;
        }
        return {
            ok: true,
            threadId: payload.threadId,
            restored,
            workflowIds: workflows.map((workflow) => workflow.id),
            dataTableIds,
            agentIds: createdAgentIds,
            folderIds,
        };
    }
    async seedEvalDataTableRows(req, _res, payload) {
        this.requireInstanceAiEnabled();
        await this.assertThreadAccess(req.user.id, payload.threadId);
        const projectId = await this.memoryService.getThreadProjectId(payload.threadId);
        if (!projectId) {
            throw new errors_1.BadRequestError('Thread is not bound to a project');
        }
        await this.evalThreadRestore.reseedDataTableRows(payload.tableId, projectId, payload.rows);
        return { ok: true, tableId: payload.tableId, rowCount: payload.rows.length };
    }
    async createGatewayLink(req) {
        await this.assertGatewayEnabled(req.user.id);
        const token = this.gatewayService.generatePairingToken(req.user.id);
        const expiresAt = this.gatewayService.getGatewayApiKeyExpiresAt(req.user.id, token);
        const ttlSeconds = expiresAt
            ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 1000))
            : null;
        const baseUrl = this.urlService.getInstanceBaseUrl();
        const command = `npx @n8n/computer-use ${baseUrl} ${token}`;
        return { token, command, expiresAt: expiresAt?.toISOString() ?? null, ttlSeconds };
    }
    async gatewayEvents(req, res) {
        const userId = this.validateGatewayApiKey(this.getGatewayKeyHeader(req));
        await this.assertGatewayEnabled(userId);
        const gateway = this.gatewayService.getLocalGateway(userId);
        if (!gateway.isConnected) {
            throw new errors_1.ForbiddenError('Local gateway not initialized');
        }
        this.gatewayService.clearDisconnectTimer(userId);
        res.compress = false;
        res.setHeader('Content-Type', 'text/event-stream; charset=UTF-8');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders();
        const unsubscribeRequest = gateway.onRequest((event) => {
            res.write(`data: ${JSON.stringify(event)}\n\n`);
            res.flush?.();
        });
        const unsubscribeDisconnect = gateway.onDisconnect((event) => {
            res.write(`data: ${JSON.stringify(event)}\n\n`);
            res.flush?.();
            res.end();
        });
        const keepAlive = setInterval(() => {
            res.write(': ping\n\n');
            res.flush?.();
        }, KEEP_ALIVE_INTERVAL_MS);
        let cleanedUp = false;
        const cleanup = () => {
            if (cleanedUp)
                return;
            cleanedUp = true;
            unsubscribeRequest();
            unsubscribeDisconnect();
            clearInterval(keepAlive);
            this.gatewayService.startDisconnectTimer(userId, () => {
                this.push.sendToUsers({
                    type: 'instanceAiGatewayStateChanged',
                    data: {
                        connected: false,
                        directory: null,
                        hostIdentifier: null,
                        toolCategories: [],
                    },
                }, [userId]);
            });
        };
        res.once('close', cleanup);
        res.once('finish', cleanup);
    }
    async gatewayInit(req, _res, payload) {
        const key = this.getGatewayKeyHeader(req);
        const userId = this.validateGatewayApiKey(key);
        await this.assertGatewayEnabled(userId);
        this.gatewayService.initGateway(userId, payload);
        this.gatewayService.applyToolPolicy(userId);
        const status = this.gatewayService.getGatewayStatus(userId);
        this.push.sendToUsers({
            type: 'instanceAiGatewayStateChanged',
            data: {
                connected: status.connected,
                directory: status.directory,
                hostIdentifier: status.hostIdentifier,
                toolCategories: status.toolCategories,
            },
        }, [userId]);
        const sessionKey = key ? this.gatewayService.consumePairingToken(userId, key) : null;
        if (sessionKey) {
            return { ok: true, sessionKey };
        }
        return { ok: true };
    }
    gatewayDisconnect(req) {
        const userId = this.validateGatewayApiKey(this.getGatewayKeyHeader(req));
        this.gatewayService.clearDisconnectTimer(userId);
        this.gatewayService.disconnectGateway(userId);
        this.gatewayService.clearActiveSessionKey(userId);
        this.push.sendToUsers({
            type: 'instanceAiGatewayStateChanged',
            data: { connected: false, directory: null, hostIdentifier: null, toolCategories: [] },
        }, [userId]);
        return { ok: true };
    }
    gatewayResponse(req, _res, requestId, payload) {
        const userId = this.validateGatewayApiKey(this.getGatewayKeyHeader(req));
        const resolved = this.gatewayService.resolveGatewayRequest(userId, requestId, payload.result, payload.error);
        if (!resolved) {
            throw new errors_1.NotFoundError('Gateway request not found or already resolved');
        }
        return { ok: true };
    }
    async gatewayCreateCredential(req, _res, payload) {
        const user = await this.resolveGatewayUser(this.getGatewayKeyHeader(req));
        await this.assertGatewayEnabled(user.id);
        const credential = await this.credentialsService.createUnmanagedCredential(payload, user);
        return { credentialId: credential.id };
    }
    async gatewayStatus(req) {
        await this.assertGatewayEnabled(req.user.id);
        this.gatewayService.applyToolPolicy(req.user.id);
        return this.gatewayService.getGatewayStatus(req.user.id);
    }
    async gatewayDisconnectSession(req) {
        const userId = req.user.id;
        this.gatewayService.clearDisconnectTimer(userId);
        this.gatewayService.disconnectGateway(userId);
        this.gatewayService.clearActiveSessionKey(userId);
        this.push.sendToUsers({
            type: 'instanceAiGatewayStateChanged',
            data: { connected: false, directory: null, hostIdentifier: null, toolCategories: [] },
        }, [userId]);
        return { ok: true };
    }
    async createBrowserLink(req) {
        this.requireInstanceAiEnabled();
        this.assertBrowserChannelEnabled();
        return await this.browserSessionService.createLink(req.user.id);
    }
    browserStatus(req) {
        this.requireInstanceAiEnabled();
        this.assertBrowserChannelEnabled();
        return this.browserSessionService.getStatus(req.user.id);
    }
    async browserDisconnectSession(req) {
        this.requireInstanceAiEnabled();
        await this.browserSessionService.disconnect(req.user.id);
        return { ok: true };
    }
    assertBrowserChannelEnabled() {
        if (!this.settingsService.isBrowserUseEnabled()) {
            throw new errors_1.ForbiddenError('Browser Use is disabled');
        }
    }
    async assertThreadAccess(userId, threadId, options) {
        const ownership = await this.memoryService.checkThreadOwnership(userId, threadId);
        if (ownership === 'other_user') {
            throw new errors_1.ForbiddenError('Not authorized for this thread');
        }
        if (!options?.allowNew && ownership === 'not_found') {
            throw new errors_1.NotFoundError('Thread not found');
        }
    }
    async assertGatewayEnabled(userId) {
        if (await this.settingsService.isLocalGatewayDisabledForUser(userId)) {
            throw new errors_1.ForbiddenError('Local gateway is disabled');
        }
    }
    getGatewayKeyHeader(req) {
        const raw = req.headers['x-gateway-key'];
        const value = Array.isArray(raw) ? raw[0] : raw;
        const parsed = api_types_1.instanceAiGatewayKeySchema.safeParse(value);
        return parsed.success ? parsed.data : undefined;
    }
    validateGatewayApiKey(key) {
        if (!key) {
            throw new errors_1.ForbiddenError('Missing API key');
        }
        const actual = Buffer.from(key);
        if (this.gatewayApiKey) {
            const expected = Buffer.from(this.gatewayApiKey);
            if (expected.length === actual.length && (0, node_crypto_1.timingSafeEqual)(expected, actual)) {
                return 'env-gateway';
            }
        }
        const userId = this.gatewayService.getUserIdForApiKey(key);
        if (userId)
            return userId;
        throw new errors_1.ForbiddenError('Invalid API key');
    }
    async resolveGatewayUser(key) {
        const userId = this.validateGatewayApiKey(key);
        if (userId === 'env-gateway') {
            throw new errors_1.ForbiddenError('Credential creation requires a user-scoped gateway key');
        }
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['role', 'role.scopes'],
        });
        if (!user)
            throw new errors_1.ForbiddenError('Invalid API key');
        return user;
    }
    writeSseEvent(res, stored) {
        const idLine = stored.id !== undefined ? `id: ${stored.id}\n` : '';
        res.write(`${idLine}data: ${JSON.stringify(stored.event)}\n\n`);
        res.flush?.();
    }
};
exports.InstanceAiController = InstanceAiController;
__decorate([
    (0, decorators_1.Middleware)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Function]),
    __metadata("design:returntype", void 0)
], InstanceAiController.prototype, "stripBrotli", null);
__decorate([
    (0, decorators_1.Post)('/chat/:threadId'),
    (0, decorators_1.GlobalScope)('instanceAi:message'),
    __param(2, (0, decorators_1.Param)('threadId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.InstanceAiSendMessageRequest]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "chat", null);
__decorate([
    (0, decorators_1.Get)('/events/:threadId', { usesTemplates: true }),
    (0, decorators_1.GlobalScope)('instanceAi:message'),
    __param(2, (0, decorators_1.Param)('threadId')),
    __param(3, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.InstanceAiEventsQuery]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "events", null);
__decorate([
    (0, decorators_1.Post)('/confirm/:requestId'),
    (0, decorators_1.GlobalScope)('instanceAi:message'),
    __param(2, (0, decorators_1.Param)('requestId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "confirm", null);
__decorate([
    (0, decorators_1.Post)('/chat/:threadId/cancel'),
    (0, decorators_1.GlobalScope)('instanceAi:message'),
    __param(2, (0, decorators_1.Param)('threadId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "cancel", null);
__decorate([
    (0, decorators_1.Post)('/feedback/:threadId/:responseId'),
    (0, decorators_1.GlobalScope)('instanceAi:message'),
    __param(2, (0, decorators_1.Param)('threadId')),
    __param(3, (0, decorators_1.Param)('responseId')),
    __param(4, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, api_types_1.InstanceAiFeedbackRequestDto]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "feedback", null);
__decorate([
    (0, decorators_1.Post)('/chat/:threadId/tasks/:taskId/cancel'),
    (0, decorators_1.GlobalScope)('instanceAi:message'),
    __param(2, (0, decorators_1.Param)('threadId')),
    __param(3, (0, decorators_1.Param)('taskId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "cancelTask", null);
__decorate([
    (0, decorators_1.Post)('/chat/:threadId/tasks/:taskId/correct'),
    (0, decorators_1.GlobalScope)('instanceAi:message'),
    __param(2, (0, decorators_1.Param)('threadId')),
    __param(3, (0, decorators_1.Param)('taskId')),
    __param(4, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, api_types_1.InstanceAiCorrectTaskRequest]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "correctTask", null);
__decorate([
    (0, decorators_1.Post)('/threads/:threadId/preferences/:preferenceId/undo'),
    (0, decorators_1.GlobalScope)('instanceAi:message'),
    __param(2, (0, decorators_1.Param)('threadId')),
    __param(3, (0, decorators_1.Param)('preferenceId')),
    __param(4, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, api_types_1.InstanceAiPreferenceCardUndoRequestDto]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "undoPreference", null);
__decorate([
    (0, decorators_1.Post)('/threads/:threadId/preferences/:preferenceId/edit'),
    (0, decorators_1.GlobalScope)('instanceAi:message'),
    __param(2, (0, decorators_1.Param)('threadId')),
    __param(3, (0, decorators_1.Param)('preferenceId')),
    __param(4, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, api_types_1.InstanceAiPreferenceCardEditRequestDto]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "editPreference", null);
__decorate([
    (0, decorators_1.Get)('/credits'),
    (0, decorators_1.GlobalScope)('instanceAi:message'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "getCredits", null);
__decorate([
    (0, decorators_1.Get)('/settings'),
    (0, decorators_1.GlobalScope)('instanceAi:manage'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "getAdminSettings", null);
__decorate([
    (0, decorators_1.Get)('/settings/models'),
    (0, decorators_1.GlobalScope)('instanceAi:manage'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "getModelCatalog", null);
__decorate([
    (0, decorators_1.Put)('/settings'),
    (0, decorators_1.GlobalScope)('instanceAi:manage'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.InstanceAiAdminSettingsUpdateRequest]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "updateAdminSettings", null);
__decorate([
    (0, decorators_1.Post)('/settings/verify/model'),
    (0, decorators_1.GlobalScope)('instanceAi:manage'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.InstanceAiVerifyModelRequest]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "verifyModel", null);
__decorate([
    (0, decorators_1.Post)('/settings/verify/sandbox'),
    (0, decorators_1.GlobalScope)('instanceAi:manage'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.InstanceAiVerifySandboxRequest]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "verifySandbox", null);
__decorate([
    (0, decorators_1.Post)('/settings/verify/search'),
    (0, decorators_1.GlobalScope)('instanceAi:manage'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.InstanceAiVerifySearchRequest]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "verifySearch", null);
__decorate([
    (0, decorators_1.OnPubSubEvent)('reload-instance-ai-settings', { instanceType: 'main' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "reloadAdminSettings", null);
__decorate([
    (0, decorators_1.Get)('/preferences'),
    (0, decorators_1.GlobalScope)('instanceAi:message'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "getUserPreferences", null);
__decorate([
    (0, decorators_1.Put)('/preferences'),
    (0, decorators_1.GlobalScope)('instanceAi:message'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.InstanceAiUserPreferencesUpdateRequest]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "updateUserPreferences", null);
__decorate([
    (0, decorators_1.Get)('/settings/service-credentials'),
    (0, decorators_1.GlobalScope)('instanceAi:manage'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "listServiceCredentials", null);
__decorate([
    (0, decorators_1.Get)('/settings/model-credentials'),
    (0, decorators_1.GlobalScope)('instanceAi:manage'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "listInstanceModelCredentials", null);
__decorate([
    (0, decorators_1.Get)('/threads'),
    (0, decorators_1.GlobalScope)('instanceAi:message'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "listThreads", null);
__decorate([
    (0, decorators_1.Get)('/threads/history'),
    (0, decorators_1.GlobalScope)('instanceAi:message'),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.InstanceAiThreadHistoryQuery]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "listThreadHistory", null);
__decorate([
    (0, decorators_1.Get)('/threads/:threadId'),
    (0, decorators_1.GlobalScope)('instanceAi:message'),
    __param(2, (0, decorators_1.Param)('threadId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "getThread", null);
__decorate([
    (0, decorators_1.Post)('/threads'),
    (0, decorators_1.GlobalScope)('instanceAi:message'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.InstanceAiEnsureThreadRequest]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "ensureThread", null);
__decorate([
    (0, decorators_1.Delete)('/threads/:threadId'),
    (0, decorators_1.GlobalScope)('instanceAi:message'),
    __param(2, (0, decorators_1.Param)('threadId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "deleteThread", null);
__decorate([
    (0, decorators_1.Patch)('/threads/:threadId'),
    (0, decorators_1.GlobalScope)('instanceAi:message'),
    __param(2, (0, decorators_1.Param)('threadId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.InstanceAiRenameThreadRequestDto]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "renameThread", null);
__decorate([
    (0, decorators_1.Get)('/threads/:threadId/tabs'),
    (0, decorators_1.GlobalScope)('instanceAi:message'),
    __param(2, (0, decorators_1.Param)('threadId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "getThreadTabs", null);
__decorate([
    (0, decorators_1.Put)('/threads/:threadId/tabs'),
    (0, decorators_1.GlobalScope)('instanceAi:message'),
    __param(2, (0, decorators_1.Param)('threadId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.InstanceAiThreadTabsRequestDto]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "saveThreadTabs", null);
__decorate([
    (0, decorators_1.Post)('/threads/:threadId/agent'),
    (0, decorators_1.GlobalScope)('instanceAi:message'),
    __param(2, (0, decorators_1.Param)('threadId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.InstanceAiPersistPendingAgentRequest]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "persistPendingAgent", null);
__decorate([
    (0, decorators_1.Get)('/threads/:threadId/messages'),
    (0, decorators_1.GlobalScope)('instanceAi:message'),
    __param(2, (0, decorators_1.Param)('threadId')),
    __param(3, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.InstanceAiThreadMessagesQuery]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "getThreadMessages", null);
__decorate([
    (0, decorators_1.Get)('/threads/:threadId/status'),
    (0, decorators_1.GlobalScope)('instanceAi:message'),
    __param(2, (0, decorators_1.Param)('threadId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "getThreadStatus", null);
__decorate([
    (0, decorators_1.Get)('/debug/runs/:runId'),
    (0, decorators_1.GlobalScope)('instanceAi:message'),
    __param(2, (0, decorators_1.Param)('runId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "getRunDebug", null);
__decorate([
    (0, decorators_1.Get)('/debug/threads/:threadId/runs'),
    (0, decorators_1.GlobalScope)('instanceAi:message'),
    __param(2, (0, decorators_1.Param)('threadId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "listThreadDebugRuns", null);
__decorate([
    (0, decorators_1.Post)('/eval/execute-with-llm-mock/:workflowId'),
    (0, decorators_1.GlobalScope)('instanceAi:eval'),
    __param(2, (0, decorators_1.Param)('workflowId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.InstanceAiEvalExecutionRequest]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "executeWithLlmMock", null);
__decorate([
    (0, decorators_1.Post)('/eval/execute-agent-with-llm-mock/:agentId'),
    (0, decorators_1.GlobalScope)('instanceAi:eval'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.InstanceAiEvalAgentExecutionRequest]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "executeAgentWithLlmMock", null);
__decorate([
    (0, decorators_1.Post)('/eval/thread-credential-allowlist'),
    (0, decorators_1.GlobalScope)('instanceAi:eval'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.InstanceAiEvalCredentialAllowlistRequest]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "setThreadCredentialAllowlist", null);
__decorate([
    (0, decorators_1.Post)('/eval/thread-credential-test-target'),
    (0, decorators_1.GlobalScope)('instanceAi:eval'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.InstanceAiEvalCredentialTestTargetRequest]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "setThreadCredentialTestTarget", null);
__decorate([
    (0, decorators_1.Get)('/eval/threads/:threadId/memory'),
    (0, decorators_1.GlobalScope)('instanceAi:eval'),
    __param(2, (0, decorators_1.Param)('threadId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "getEvalThreadMemory", null);
__decorate([
    (0, decorators_1.Post)('/eval/restore-thread'),
    (0, decorators_1.GlobalScope)('instanceAi:eval'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.InstanceAiEvalRestoreThreadRequest]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "restoreEvalThread", null);
__decorate([
    (0, decorators_1.Post)('/eval/seed-data-table-rows'),
    (0, decorators_1.GlobalScope)('instanceAi:eval'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.InstanceAiEvalSeedDataTableRowsRequest]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "seedEvalDataTableRows", null);
__decorate([
    (0, decorators_1.Post)('/gateway/create-link'),
    (0, decorators_1.GlobalScope)('instanceAi:gateway'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "createGatewayLink", null);
__decorate([
    (0, decorators_1.Get)('/gateway/events', { usesTemplates: true, skipAuth: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "gatewayEvents", null);
__decorate([
    (0, decorators_1.Post)('/gateway/init', { skipAuth: true }),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.InstanceAiGatewayCapabilitiesDto]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "gatewayInit", null);
__decorate([
    (0, decorators_1.Post)('/gateway/disconnect', { skipAuth: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InstanceAiController.prototype, "gatewayDisconnect", null);
__decorate([
    (0, decorators_1.Post)('/gateway/response/:requestId', { skipAuth: true }),
    __param(2, (0, decorators_1.Param)('requestId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.InstanceAiFilesystemResponseDto]),
    __metadata("design:returntype", void 0)
], InstanceAiController.prototype, "gatewayResponse", null);
__decorate([
    (0, decorators_1.Post)('/gateway/credentials', { skipAuth: true }),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.InstanceAiGatewayCreateCredentialDto]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "gatewayCreateCredential", null);
__decorate([
    (0, decorators_1.Get)('/gateway/status'),
    (0, decorators_1.GlobalScope)('instanceAi:gateway'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "gatewayStatus", null);
__decorate([
    (0, decorators_1.Post)('/gateway/disconnect-session'),
    (0, decorators_1.GlobalScope)('instanceAi:gateway'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "gatewayDisconnectSession", null);
__decorate([
    (0, decorators_1.Post)('/browser/create-link'),
    (0, decorators_1.GlobalScope)('instanceAi:gateway'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "createBrowserLink", null);
__decorate([
    (0, decorators_1.Get)('/browser/status'),
    (0, decorators_1.GlobalScope)('instanceAi:gateway'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InstanceAiController.prototype, "browserStatus", null);
__decorate([
    (0, decorators_1.Post)('/browser/disconnect-session'),
    (0, decorators_1.GlobalScope)('instanceAi:gateway'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InstanceAiController.prototype, "browserDisconnectSession", null);
exports.InstanceAiController = InstanceAiController = __decorate([
    (0, decorators_1.RestController)('/instance-ai'),
    __metadata("design:paramtypes", [instance_ai_service_1.InstanceAiService, instance_ai_gateway_service_1.InstanceAiGatewayService, instance_ai_browser_session_service_1.InstanceAiBrowserSessionService, instance_ai_memory_service_1.InstanceAiMemoryService, onboarding_1.InstanceAiOnboardingService, instance_ai_pending_agent_service_1.InstanceAiPendingAgentService, instance_ai_settings_service_1.InstanceAiSettingsService, instance_ai_model_catalog_service_1.InstanceAiModelCatalogService, execution_service_1.EvalExecutionService, agent_execution_service_1.EvalAgentExecutionService, thread_credential_allowlist_service_1.EvalThreadCredentialAllowlistService, thread_restore_service_1.EvalThreadRestoreService, in_process_event_bus_1.InProcessEventBus, durable_event_log_1.DurableEventLog, durable_log_metrics_1.DurableLogMetrics, backend_common_1.ModuleRegistry, push_1.Push, backend_services_1.UrlService, db_1.UserRepository, credentials_service_1.CredentialsService, project_service_ee_1.ProjectService, instance_ai_error_reporter_service_1.InstanceAiErrorReporterService, publisher_service_1.Publisher, instance_ai_preference_card_service_1.InstanceAiPreferenceCardService, config_1.GlobalConfig, instance_ai_thread_tabs_service_1.InstanceAiThreadTabsService])
], InstanceAiController);
//# sourceMappingURL=instance-ai.controller.js.map