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
var AgentExecutionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentExecutionService = void 0;
exports.toSessionStatus = toSessionStatus;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const chunk_1 = __importDefault(require("lodash/chunk"));
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const errors_1 = require("@n8n/errors");
const telemetry_1 = require("../../telemetry");
const agent_chat_attachment_service_1 = require("./agent-chat-attachment.service");
const agent_execution_update_broadcaster_1 = require("./agent-execution-update-broadcaster");
const agent_turn_already_running_error_1 = require("./agent-turn-already-running.error");
const agent_message_queue_repository_1 = require("./repositories/agent-message-queue.repository");
const agent_queued_message_1 = require("./types/agent-queued-message");
const agent_message_repository_1 = require("./repositories/agent-message.repository");
const agent_message_mapper_1 = require("./agent-message-mapper");
const inbound_attachments_1 = require("./utils/inbound-attachments");
const agent_telemetry_1 = require("./agent-telemetry");
const agent_ref_1 = require("./utils/agent-ref");
const agent_entity_1 = require("./entities/agent.entity");
const agent_execution_log_store_1 = require("./execution-log/agent-execution-log-store");
const n8n_memory_1 = require("./integrations/n8n-memory");
const n8n_checkpoint_storage_1 = require("./integrations/n8n-checkpoint-storage");
const agent_memory_scope_1 = require("./utils/agent-memory-scope");
const agent_thread_access_1 = require("./utils/agent-thread-access");
const agent_execution_thread_repository_1 = require("./repositories/agent-execution-thread.repository");
const agent_execution_repository_1 = require("./repositories/agent-execution.repository");
const execution_failure_summary_1 = require("./utils/execution-failure-summary");
const fatal_session_outcome_1 = require("./utils/fatal-session-outcome");
const TIMELINE_SNAPSHOT_RETRY_DELAY_MS = 1_000;
let AgentExecutionService = AgentExecutionService_1 = class AgentExecutionService {
    constructor(logger, agentExecutionRepository, agentExecutionThreadRepository, n8nMemory, telemetry, agentChatAttachmentService, agentExecutionLogStore, storageConfig, errorReporter, executionUpdateBroadcaster, checkpointStorage, txRunner, queueRepository, messageRepository) {
        this.logger = logger;
        this.agentExecutionRepository = agentExecutionRepository;
        this.agentExecutionThreadRepository = agentExecutionThreadRepository;
        this.n8nMemory = n8nMemory;
        this.telemetry = telemetry;
        this.agentChatAttachmentService = agentChatAttachmentService;
        this.agentExecutionLogStore = agentExecutionLogStore;
        this.storageConfig = storageConfig;
        this.errorReporter = errorReporter;
        this.executionUpdateBroadcaster = executionUpdateBroadcaster;
        this.checkpointStorage = checkpointStorage;
        this.txRunner = txRunner;
        this.queueRepository = queueRepository;
        this.messageRepository = messageRepository;
        this.heartbeatTimers = new Map();
        this.executionControllers = new Map();
        this.pendingTimelineSnapshots = new Map();
        this.timelineSnapshotWrites = new Map();
        this.pausedTimelineSnapshots = new Set();
        this.executionsNeedingTitleSync = new Set();
        this.sideCallReportInFlight = new Map();
        this.sideCallUsageInFlightByExecution = new Map();
    }
    async startExecutionRecording(params, startedAt) {
        const reservation = await this.txRunner.run({}, async (ctx) => await this.reserveExecution(params, startedAt, ctx));
        this.activateExecution(reservation, params);
        return {
            executionId: reservation.execution.id,
            startedAt,
            inputMessageIds: reservation.inputMessageIds,
        };
    }
    async reserveExecution(params, startedAt, ctx, lockedQueueThread) {
        const prepared = lockedQueueThread
            ? { thread: lockedQueueThread, created: false }
            : await this.prepareThread(params, ctx);
        const { queueItem, predecessorId } = await this.checkAdmission(params, ctx);
        const execution = this.agentExecutionRepository.create({
            threadId: params.threadId,
            status: 'running',
            acceptsSteering: params.acceptsSteering === true,
            startedAt,
            stoppedAt: null,
            duration: 0,
            userMessage: null,
            author: null,
            model: null,
            promptTokens: null,
            completionTokens: null,
            totalTokens: null,
            cost: null,
            timeline: params.initialTimeline?.length ? params.initialTimeline : null,
            storedAt: 'db',
            error: null,
            failureSummary: null,
            hitlStatus: null,
            source: params.source ?? null,
            attachments: null,
        });
        const inserted = await this.agentExecutionRepository.saveInContext(execution, ctx);
        const inputMessageIds = await this.reserveInput(params, inserted.id, predecessorId, queueItem?.messageId, ctx);
        if (queueItem &&
            !(await this.queueRepository.linkExecution(queueItem.id, queueItem.executionId, inserted.id, ctx))) {
            throw new agent_turn_already_running_error_1.AgentTurnAlreadyRunningError();
        }
        return {
            execution: inserted,
            needsTitleSync: prepared.created || !prepared.thread.title,
            inputMessageIds,
        };
    }
    async reserveInput(params, executionId, predecessorId, queuedMessageId, ctx) {
        if (predecessorId) {
            return await this.messageRepository.copyExecutionInputs(executionId, predecessorId, params.threadId, ctx);
        }
        if (params.resumeRunId || params.userMessage === null)
            return [];
        if (queuedMessageId) {
            await this.messageRepository.linkExecutionInput(executionId, queuedMessageId, params, ctx);
            return [queuedMessageId];
        }
        const [content] = (0, inbound_attachments_1.buildInboundUserMessage)(params.userMessage, params.attachments ?? []);
        const message = await this.messageRepository.createInput({
            threadId: params.threadId,
            resourceId: params.resourceId,
            content,
            author: params.author,
            origin: {
                ...params.messageOrigin,
                source: params.source ?? null,
                ...(params.hideUserMessageFromTranscript && { hidden: true }),
            },
        }, ctx);
        await this.messageRepository.linkExecutionInput(executionId, message.id, params, ctx);
        return [message.id];
    }
    async checkAdmission(params, ctx) {
        const { threadId, agentId, resumeRunId, queueItemId } = params;
        const running = await this.agentExecutionRepository.findRunningByThread(threadId, ctx);
        const active = await this.queueRepository.findActive(threadId, ctx);
        if (resumeRunId) {
            const checkpoint = await this.checkpointStorage.getStatus(resumeRunId, agentId, ctx);
            if (checkpoint.status !== 'active' ||
                checkpoint.checkpoint.status !== 'suspended' ||
                checkpoint.checkpoint.persistence?.threadId !== threadId) {
                throw new agent_turn_already_running_error_1.AgentTurnAlreadyRunningError();
            }
            const predecessorId = (0, agent_queued_message_1.checkpointExecutionId)(checkpoint.checkpoint);
            const legacyPredecessor = !predecessorId && !active && params.allowSuspendedPredecessor;
            if (running.some(({ id }) => id !== predecessorId) &&
                !(legacyPredecessor && running.length === 1)) {
                throw new agent_turn_already_running_error_1.AgentTurnAlreadyRunningError();
            }
            const inputExecutionId = checkpoint.checkpoint.persistence?.hostMetadata?.[agent_queued_message_1.EXECUTION_METADATA_KEY];
            return {
                queueItem: active,
                predecessorId: typeof inputExecutionId === 'string' ? inputExecutionId : undefined,
            };
        }
        if (running.length ||
            active ||
            (await this.checkpointStorage.findSuspendedForThread(agentId, threadId, ctx))) {
            throw new agent_turn_already_running_error_1.AgentTurnAlreadyRunningError();
        }
        const head = await this.queueRepository.findHead(threadId, ctx);
        if (head?.id !== queueItemId && (head || queueItemId))
            throw new agent_turn_already_running_error_1.AgentTurnAlreadyRunningError();
        return { queueItem: head, predecessorId: undefined };
    }
    activateExecution({ execution, needsTitleSync }, params) {
        this.executionControllers.set(execution.id, new AbortController());
        this.startHeartbeat(execution.id);
        if (needsTitleSync)
            this.executionsNeedingTitleSync.add(execution.id);
        this.executionUpdateBroadcaster.notify({
            projectId: params.projectId,
            agentId: params.agentId,
            threadId: params.threadId,
            executionId: execution.id,
        });
    }
    getAbortSignal(executionId) {
        return this.executionControllers.get(executionId)?.signal ?? AbortSignal.abort();
    }
    recordTimelineSnapshot({ executionId, ...snapshot }) {
        if (!this.heartbeatTimers.has(executionId))
            return;
        this.pendingTimelineSnapshots.set(executionId, snapshot);
        this.ensureTimelineSnapshotWrite(executionId);
    }
    async withTimelineWritesPaused(executionId, commit) {
        this.pausedTimelineSnapshots.add(executionId);
        try {
            await this.timelineSnapshotWrites.get(executionId);
            return await commit();
        }
        catch (error) {
            this.pendingTimelineSnapshots.delete(executionId);
            throw error;
        }
        finally {
            this.pausedTimelineSnapshots.delete(executionId);
            this.ensureTimelineSnapshotWrite(executionId);
        }
    }
    async finalizeExecution(executionId, params) {
        this.stopHeartbeat(executionId);
        this.pendingTimelineSnapshots.delete(executionId);
        const record = (0, fatal_session_outcome_1.applyFatalSessionOutcome)(params.record);
        const settled = record === params.record ? params : { ...params, record };
        const status = executionStatus(record);
        const stoppedAt = new Date(record.startTime + record.duration);
        const failureSummary = (0, execution_failure_summary_1.computeExecutionFailureSummary)({
            timeline: record.timeline,
            status,
            error: record.error,
            stoppedAt: stoppedAt.getTime(),
        });
        const storedAt = record.timeline.length > 0 ? this.storageConfig.modeTag : 'db';
        try {
            await this.writeTerminalExecution(executionId, settled, status, stoppedAt, failureSummary);
            await this.moveFinalTimelineToBlob(executionId, settled, storedAt);
            this.executionUpdateBroadcaster.notify({
                projectId: params.projectId,
                agentId: params.agentId,
                threadId: params.threadId,
                executionId,
            });
            await this.completeRecordedExecution(settled, executionId, status);
            return executionId;
        }
        catch (error) {
            this.errorReporter.error(error);
            throw error;
        }
        finally {
            this.executionsNeedingTitleSync.delete(executionId);
        }
    }
    async deleteUnreferencedTimelineBlob(ref, storedAt) {
        try {
            const currentLocation = await this.agentExecutionRepository.findTimelineStorageLocation(ref.executionId);
            if (currentLocation === 'db')
                await this.agentExecutionLogStore.delete([{ ...ref, storedAt }]);
        }
        catch (error) {
            this.errorReporter.error(error);
        }
    }
    async finalizeInterruptedExecution(execution, staleBefore) {
        const timeline = execution.timeline ?? [];
        const stoppedAt = new Date();
        const error = 'Agent execution was interrupted by a process restart.';
        const duration = execution.startedAt
            ? Math.max(0, stoppedAt.getTime() - execution.startedAt.getTime())
            : 0;
        const finalized = await this.txRunner.run({}, async (ctx) => {
            if (!(await this.agentExecutionThreadRepository.lockById(execution.threadId, ctx)))
                return false;
            return await this.agentExecutionRepository.updateIfRunning(execution.id, {
                status: 'interrupted',
                stoppedAt,
                duration,
                timeline: timeline.length > 0 ? timeline : null,
                storedAt: 'db',
                error,
                failureSummary: (0, execution_failure_summary_1.computeExecutionFailureSummary)({
                    timeline,
                    status: 'interrupted',
                    error,
                    stoppedAt: stoppedAt.getTime(),
                }),
            }, staleBefore, ctx);
        });
        if (finalized)
            void this.notifyInterruptedExecution(execution);
        return finalized;
    }
    async notifyInterruptedExecution(execution) {
        try {
            const thread = await this.agentExecutionThreadRepository.findOneBy({
                id: execution.threadId,
            });
            if (!thread)
                return;
            this.executionUpdateBroadcaster.notify({
                projectId: thread.projectId,
                agentId: thread.agentId,
                threadId: execution.threadId,
                executionId: execution.id,
            });
        }
        catch (error) {
            this.logger.warn('Failed to resolve an interrupted agent execution update', {
                executionId: execution.id,
                threadId: execution.threadId,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    startHeartbeat(executionId) {
        const timer = setInterval(() => {
            void this.agentExecutionRepository
                .touchRunning(executionId)
                .then((owned) => {
                if (!owned)
                    this.abortLostExecution(executionId);
            })
                .catch((error) => {
                this.logger.warn('Failed to heartbeat a running agent execution', {
                    executionId,
                    error: error instanceof Error ? error.message : String(error),
                });
            });
        }, AgentExecutionService_1.heartbeatIntervalMs);
        timer.unref();
        this.heartbeatTimers.set(executionId, timer);
    }
    abortLostExecution(executionId) {
        this.executionControllers
            .get(executionId)
            ?.abort(new n8n_workflow_1.OperationalError('Agent execution ownership was lost'));
        this.stopHeartbeat(executionId);
    }
    stopHeartbeat(executionId) {
        const timer = this.heartbeatTimers.get(executionId);
        if (timer)
            clearInterval(timer);
        this.heartbeatTimers.delete(executionId);
        this.executionControllers.delete(executionId);
    }
    ensureTimelineSnapshotWrite(executionId) {
        if (this.pausedTimelineSnapshots.has(executionId) ||
            this.timelineSnapshotWrites.has(executionId) ||
            !this.pendingTimelineSnapshots.has(executionId)) {
            return;
        }
        const write = this.drainTimelineSnapshots(executionId).finally(() => {
            this.timelineSnapshotWrites.delete(executionId);
            this.ensureTimelineSnapshotWrite(executionId);
        });
        this.timelineSnapshotWrites.set(executionId, write);
    }
    async drainTimelineSnapshots(executionId) {
        while (!this.pausedTimelineSnapshots.has(executionId)) {
            const snapshot = this.pendingTimelineSnapshots.get(executionId);
            if (!snapshot)
                return;
            this.pendingTimelineSnapshots.delete(executionId);
            if (!(await this.writeTimelineSnapshot(executionId, snapshot)))
                return;
        }
    }
    async prepareThread(params, ctx) {
        const { thread, created } = await this.agentExecutionThreadRepository.findOrCreate(params.threadId, params.agentId, params.agentName, params.projectId, params.access, ctx, params.threadMetadata, params.taskId, params.taskVersionId, params.sessionMode);
        if (!created)
            await this.agentExecutionThreadRepository.bumpUpdatedAt(params.threadId, ctx);
        return { created, thread };
    }
    async completeRecordedExecution(params, executionId, status) {
        const { threadId, agentId, record } = params;
        await this.updateThreadAfterExecution(params, executionId);
        this.trackFinishedTurn(params, status);
        this.logger.debug('Recorded agent execution', {
            executionId,
            threadId,
            agentId,
            status,
            duration: record.duration,
        });
        if (this.executionsNeedingTitleSync.has(executionId)) {
            await this.syncTitleFromMemory(threadId, agentId);
        }
    }
    async findLatestSuspendedRun(threadId) {
        return await this.agentExecutionRepository.findLatestSuspendedByThreadId(threadId);
    }
    async backfillSuspendedExecutions(threadId, model) {
        const candidates = await this.agentExecutionRepository.findSuspendedWithoutModel(threadId);
        if (candidates.length === 0)
            return;
        await this.agentExecutionRepository.backfillModel(candidates.map((c) => c.id), model);
    }
    async syncTitleFromMemory(threadId, agentId) {
        try {
            const memoryThread = await this.n8nMemory.getImplementation(agentId).getThread(threadId);
            if (memoryThread?.title) {
                const emoji = memoryThread.metadata && typeof memoryThread.metadata.emoji === 'string'
                    ? memoryThread.metadata.emoji
                    : null;
                await this.agentExecutionThreadRepository.update(threadId, {
                    title: memoryThread.title,
                    ...(emoji && { emoji }),
                });
            }
        }
        catch {
        }
    }
    async deleteThread(projectId, agentId, threadId, userId) {
        const result = await this.txRunner.run({}, async (ctx) => {
            const deletion = await this.agentExecutionThreadRepository.deleteSession(projectId, agentId, threadId, userId, ctx);
            if (!deletion)
                return null;
            if (deletion.status === 'busy')
                return deletion;
            await this.n8nMemory.getImplementation(agentId).deleteThread(threadId, ctx);
            return deletion;
        });
        if (!result)
            return false;
        if (result.status === 'busy') {
            throw new errors_1.ConflictError('The session has active work and cannot be deleted');
        }
        const { refs } = result;
        await Promise.all([
            this.agentChatAttachmentService.deleteStoredData(refs.attachmentBinaryDataIds, { threadId }),
            this.agentExecutionLogStore.delete(this.toBlobRefs(refs.executionLogs).map((ref) => ({
                agentId,
                threadId,
                executionId: ref.id,
                storedAt: ref.storedAt,
            }))),
        ]);
        return true;
    }
    async deleteExecutionLogsForAgent(agentId) {
        const refs = this.toBlobRefs(await this.agentExecutionRepository.findBlobRefsByAgentId(agentId));
        for (const batch of (0, chunk_1.default)(refs, AgentExecutionService_1.logDeletionBatchSize)) {
            await this.agentExecutionLogStore.delete(batch.map((r) => ({
                agentId,
                threadId: r.threadId,
                executionId: r.id,
                storedAt: r.storedAt,
            })));
        }
    }
    async getThreads(projectId, agentId, userId, limit, cursor, filters = {}) {
        const page = await this.agentExecutionThreadRepository.findByProjectIdPaginated(projectId, agentId, userId, limit, cursor, filters);
        return { ...page, threads: await this.toThreadListItems(page.threads, userId) };
    }
    async findN8nChatThreadsForAgents(userId, agentIds, options) {
        const { threads, nextCursor } = await this.agentExecutionThreadRepository.findN8nChatThreadsForOwner(userId, agentIds, options);
        return { data: threads.map(toN8nChatThreadSummary), nextCursor };
    }
    async findN8nChatThreadForAgents(userId, agentIds, threadId) {
        const thread = await this.agentExecutionThreadRepository.findN8nChatThreadForOwner(userId, agentIds, threadId);
        return thread ? toN8nChatThreadSummary(thread) : null;
    }
    async countN8nChatThreadsByAgent(userId, projectIds) {
        return await this.agentExecutionThreadRepository.countN8nChatThreadsByAgent(userId, projectIds);
    }
    async toThreadListItems(threads, userId) {
        if (threads.length === 0)
            return [];
        const threadIds = threads.map((t) => t.id);
        const [messageMap, sourceMap, failureSummaryMap, latestStatusMap] = await Promise.all([
            this.agentExecutionRepository.findFirstUserMessageByThreadIds(threadIds),
            this.agentExecutionRepository.findFirstSourceByThreadIds(threadIds),
            this.agentExecutionRepository.findFailureSummariesByThreadIds(threadIds),
            this.agentExecutionRepository.findLatestStatusesByThreadIds(threadIds),
        ]);
        return threads.map((thread) => {
            const { ownerId: _ownerId, accessScope: _accessScope, owner: _owner, ...t } = thread;
            const source = sourceMap.get(t.id) ?? null;
            return {
                ...t,
                canContinueInPreview: (0, agent_thread_access_1.canContinueThreadInPreview)(thread, userId, source),
                firstMessage: cleanUserMessage(messageMap.get(t.id) ?? null, t.agentName),
                source,
                failureSummary: failureSummaryMap.get(t.id) ?? null,
                status: toSessionStatus(latestStatusMap.get(t.id)),
            };
        });
    }
    async getThreadDetail(threadId, projectId, agentId, userId) {
        const thread = await this.agentExecutionThreadRepository.findOneBy({ id: threadId });
        if (!thread)
            return null;
        if (!(0, agent_thread_access_1.threadBelongsTo)(thread, projectId, agentId, userId))
            return null;
        const executions = await this.agentExecutionRepository.findByThreadIdOrdered(threadId);
        await this.hydrateExecutionInputs(executions, thread.agentName);
        await this.hydrateTimelines(agentId, threadId, executions);
        return { thread, executions };
    }
    async hydrateExecutionInputs(executions, agentName) {
        const inputs = await this.messageRepository.findExecutionInputs(executions.map(({ id }) => id));
        const seen = new Set();
        for (const execution of executions) {
            const messages = inputs.get(execution.id);
            if (!messages)
                continue;
            execution.inputMessageIds = messages.map(({ id }) => id);
            execution.inputMessages = [];
            for (const message of messages) {
                if (seen.has(message.id))
                    continue;
                seen.add(message.id);
                if (message.origin?.hidden)
                    continue;
                const dto = this.inputMessageToDto(message, execution.id, agentName);
                if (!dto)
                    continue;
                execution.inputMessages.push(dto);
            }
            const parts = execution.inputMessages.flatMap(({ content }) => content);
            execution.userMessage =
                parts
                    .filter((part) => part.type === 'text' && part.text)
                    .map((part) => part.text)
                    .join('\n') || null;
            execution.author = execution.inputMessages[0]?.author ?? null;
            execution.attachments = parts.flatMap((part) => {
                if (part.type !== 'file' || !part.fileId)
                    return [];
                return [
                    {
                        id: part.fileId,
                        fileName: part.fileName ?? '',
                        mimeType: part.mimeType ?? 'application/octet-stream',
                        sizeBytes: part.sizeBytes ?? 0,
                    },
                ];
            });
        }
    }
    inputMessageToDto(message, executionId, agentName) {
        const dto = (0, agent_message_mapper_1.messageToDto)({ ...message.content, id: message.id, createdAt: message.createdAt });
        if (!dto)
            return null;
        dto.author = message.author ?? undefined;
        dto.executionId = executionId;
        dto.content = dto.content.filter((part) => {
            if (part.type !== 'text' || part.text === undefined)
                return true;
            const text = cleanUserMessage(part.text, agentName);
            if (text === null)
                return false;
            part.text = text;
            return true;
        });
        return dto;
    }
    async hydrateTimelines(agentId, threadId, executions) {
        const blobStored = this.toBlobRefs(executions);
        if (blobStored.length === 0)
            return;
        const readable = blobStored.filter((e) => this.agentExecutionLogStore.hasLocation(e.storedAt));
        if (readable.length < blobStored.length) {
            this.errorReporter.error(new n8n_workflow_1.UnexpectedError('Skipped reading agent execution logs for unconfigured storage location', {
                extra: { threadId, skipped: blobStored.length - readable.length },
            }));
        }
        if (readable.length === 0)
            return;
        let entries;
        try {
            entries = await this.agentExecutionLogStore.readMany(readable.map((e) => ({ agentId, threadId, executionId: e.id, storedAt: e.storedAt })));
        }
        catch (error) {
            this.errorReporter.error(error);
            return;
        }
        for (const execution of readable) {
            const entry = entries.get(execution.id);
            if (entry)
                execution.timeline = entry.timeline;
        }
    }
    async findThreadById(threadId) {
        return await this.agentExecutionThreadRepository.findOneBy({ id: threadId });
    }
    async canUseDraftThread(threadId, projectId, agentId, userId, options = {}) {
        const thread = await this.findThreadById(threadId);
        if (thread) {
            if (!(0, agent_thread_access_1.threadBelongsTo)(thread, projectId, agentId, userId))
                return false;
            if (!options.previewChat)
                return (0, agent_thread_access_1.canUseTopLevelDraftThread)(thread, userId);
            const sources = await this.agentExecutionRepository.findFirstSourceByThreadIds([threadId]);
            return (0, agent_thread_access_1.canContinueThreadInPreview)(thread, userId, sources.get(threadId));
        }
        if (options.sessionMode === 'existing')
            return false;
        return await this.canUseUnrecordedThread(threadId, agentId, (0, agent_memory_scope_1.draftChatMemoryResourceId)(userId));
    }
    async canUseProductionChatThread(threadId, projectId, agentId, userId, sessionMode) {
        const thread = await this.findThreadById(threadId);
        if (!thread)
            return (sessionMode === 'new' &&
                (await this.canUseUnrecordedThread(threadId, agentId, (0, agent_memory_scope_1.productionChatMemoryResourceId)(userId))));
        if (thread.projectId !== projectId ||
            thread.agentId !== agentId ||
            !(0, agent_thread_access_1.canUseTopLevelDraftThread)(thread, userId))
            return false;
        const sources = await this.agentExecutionRepository.findFirstSourceByThreadIds([threadId]);
        return (0, agent_thread_access_1.canContinueThreadInN8nChat)(thread, userId, sources.get(threadId));
    }
    async canUseUnrecordedThread(threadId, agentId, resourceId) {
        const memory = await this.n8nMemory.getImplementation(agentId).getThread(threadId);
        if (memory && memory.resourceId !== resourceId)
            return false;
        return await this.checkpointStorage.hasNoConflictingThreadResource(agentId, threadId, resourceId);
    }
    async getSessionMode(threadId) {
        return (await this.findThreadById(threadId)) ? 'existing' : 'new';
    }
    toBlobRefs(refs) {
        return refs.filter((r) => r.storedAt !== 'db');
    }
    async writeTerminalExecution(executionId, params, status, stoppedAt, failureSummary) {
        const { record, hitlStatus } = params;
        await this.timelineSnapshotWrites.get(executionId);
        const inFlight = this.sideCallUsageInFlightByExecution.get(executionId);
        if (inFlight) {
            this.sideCallUsageInFlightByExecution.delete(executionId);
            await Promise.allSettled(inFlight);
        }
        const terminalValues = {
            status,
            stoppedAt,
            duration: record.duration,
            model: record.model,
            promptTokens: record.usage?.promptTokens ?? null,
            completionTokens: record.usage?.completionTokens ?? null,
            totalTokens: record.usage?.totalTokens ?? null,
            timeline: record.timeline.length > 0 ? record.timeline : null,
            storedAt: 'db',
            error: record.error,
            failureSummary,
            hitlStatus: hitlStatus ?? null,
        };
        const maxAttempts = 3;
        let lastError;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const finalized = await this.txRunner.run({}, async (ctx) => {
                    if (!(await this.agentExecutionThreadRepository.lockById(params.threadId, ctx)))
                        return false;
                    return await this.agentExecutionRepository.updateIfRunning(executionId, terminalValues, undefined, ctx, record.totalCost ?? undefined);
                });
                if (!finalized) {
                    throw new n8n_workflow_1.OperationalError('Agent execution is no longer running', {
                        extra: { executionId },
                    });
                }
                return;
            }
            catch (error) {
                if (error instanceof n8n_workflow_1.OperationalError &&
                    error.message === 'Agent execution is no longer running') {
                    throw error;
                }
                lastError = error;
                if (attempt < maxAttempts) {
                    const delay = 100 * attempt;
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
            }
        }
        throw lastError;
    }
    async moveFinalTimelineToBlob(executionId, params, storedAt) {
        if (storedAt === 'db')
            return;
        const { record } = params;
        const logRef = { agentId: params.agentId, threadId: params.threadId, executionId };
        let blobWritten = false;
        try {
            await this.agentExecutionLogStore.write(logRef, { timeline: record.timeline }, storedAt);
            blobWritten = true;
            await this.agentExecutionRepository.moveTimelineToBlob(executionId, storedAt);
        }
        catch (error) {
            this.errorReporter.error(error);
            if (blobWritten)
                await this.deleteUnreferencedTimelineBlob(logRef, storedAt);
        }
    }
    async writeTimelineSnapshot(executionId, snapshot) {
        try {
            if (!(await this.agentExecutionRepository.updateTimelineIfRunning(executionId, snapshot.timeline))) {
                this.pendingTimelineSnapshots.delete(executionId);
                return false;
            }
            this.executionUpdateBroadcaster.notify({
                projectId: snapshot.projectId,
                agentId: snapshot.agentId,
                threadId: snapshot.threadId,
                executionId,
            });
        }
        catch (error) {
            if (!this.heartbeatTimers.has(executionId))
                return false;
            if (!this.pendingTimelineSnapshots.has(executionId)) {
                this.pendingTimelineSnapshots.set(executionId, snapshot);
            }
            this.logger.warn('Failed to persist an agent execution timeline snapshot; retrying', {
                executionId,
                error: error instanceof Error ? error.message : String(error),
            });
            await new Promise((resolve) => {
                const timer = setTimeout(resolve, TIMELINE_SNAPSHOT_RETRY_DELAY_MS);
                timer.unref();
            });
        }
        return true;
    }
    async updateThreadAfterExecution(params, executionId) {
        const { threadId, record, hitlStatus } = params;
        const updates = [];
        if (hitlStatus === 'resumed' && record.model) {
            updates.push(this.backfillSuspendedExecutions(threadId, record.model));
        }
        if (record.usage) {
            updates.push(this.agentExecutionThreadRepository.incrementUsage(threadId, record.usage.promptTokens, record.usage.completionTokens, record.totalCost ?? 0, record.duration));
        }
        for (const result of await Promise.allSettled(updates)) {
            if (result.status === 'rejected') {
                this.logger.warn('Failed to update agent execution thread metadata', {
                    executionId,
                    threadId,
                    error: result.reason,
                });
            }
        }
    }
    async recordSideCallUsage(executionId, threadId, report) {
        let attempt = this.sideCallReportInFlight.get(report.reportId);
        if (attempt === undefined) {
            const created = this.applySideCallUsage(executionId, threadId, report);
            attempt = created;
            this.sideCallReportInFlight.set(report.reportId, created);
            let bucket = this.sideCallUsageInFlightByExecution.get(executionId);
            if (!bucket) {
                bucket = new Set();
                this.sideCallUsageInFlightByExecution.set(executionId, bucket);
            }
            bucket.add(created);
            void created.finally(() => bucket?.delete(created));
        }
        try {
            await attempt;
        }
        finally {
            if (this.sideCallReportInFlight.get(report.reportId) === attempt) {
                this.sideCallReportInFlight.delete(report.reportId);
            }
        }
    }
    async applySideCallUsage(executionId, threadId, report) {
        try {
            await this.txRunner.run({}, async (ctx) => {
                await this.agentExecutionRepository.incrementCost(executionId, report.cost, ctx);
                await this.agentExecutionThreadRepository.incrementUsage(threadId, 0, 0, report.cost, 0, ctx);
            });
        }
        catch (error) {
            this.logger.warn('Failed to record agent side-call usage', {
                executionId,
                threadId,
                task: report.task,
                reportId: report.reportId,
                error,
            });
        }
    }
    trackFinishedTurn(params, status) {
        if (!params.telemetry)
            return;
        const { agentId, threadId, record } = params;
        try {
            this.telemetry.trackAgentTurnFinished({
                agent_id: agentId,
                user_id: params.telemetry.userId,
                thread_id: threadId,
                run_type: params.telemetry.runType,
                source: params.source,
                turn_status: status === 'success' ? 'succeeded' : 'failed',
                configuration: params.telemetry.configuration,
                ...(0, agent_telemetry_1.buildAgentTurnMetrics)(record),
            });
        }
        catch (error) {
            this.logger.warn('Failed to track agent execution telemetry', {
                agentId,
                threadId,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
};
exports.AgentExecutionService = AgentExecutionService;
AgentExecutionService.logDeletionBatchSize = 500;
AgentExecutionService.heartbeatIntervalMs = 30_000;
exports.AgentExecutionService = AgentExecutionService = AgentExecutionService_1 = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, agent_execution_repository_1.AgentExecutionRepository, agent_execution_thread_repository_1.AgentExecutionThreadRepository, n8n_memory_1.N8nMemory, telemetry_1.Telemetry, agent_chat_attachment_service_1.AgentChatAttachmentService, agent_execution_log_store_1.AgentExecutionLogStore, n8n_core_1.StorageConfig, n8n_core_1.ErrorReporter, agent_execution_update_broadcaster_1.AgentExecutionUpdateBroadcaster, n8n_checkpoint_storage_1.N8NCheckpointStorage, db_1.TransactionRunner, agent_message_queue_repository_1.AgentMessageQueueRepository, agent_message_repository_1.AgentMessageRepository])
], AgentExecutionService);
function toSessionStatus(latestStatus) {
    if (!latestStatus)
        return null;
    if (latestStatus === 'success')
        return 'succeeded';
    return latestStatus;
}
function cleanUserMessage(message, agentName) {
    if (message === null)
        return null;
    const cleaned = message
        .replace(/<@[A-Z0-9]+>/gi, `@${agentName}`)
        .replace(/@[A-Z0-9]{8,}/gi, `@${agentName}`)
        .trim();
    return cleaned.length > 0 ? cleaned : null;
}
function executionStatus(record) {
    if (record.error !== null || record.finishReason === 'error')
        return 'error';
    if (record.finishReason === 'cancelled')
        return 'cancelled';
    return 'success';
}
function toN8nChatThreadSummary(thread) {
    if (!(0, agent_entity_1.isProjectAgent)(thread.agent)) {
        throw new n8n_workflow_1.UnexpectedError(`Thread ${thread.id} does not belong to a project agent`);
    }
    return {
        id: thread.id,
        title: thread.title,
        updatedAt: thread.updatedAt.toISOString(),
        agent: { ...(0, agent_ref_1.toAgentRef)(thread.agent), projectId: thread.agent.projectId },
    };
}
//# sourceMappingURL=agent-execution.service.js.map