"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScalingService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const sleep_1 = require("@n8n/utils/sleep");
const n8n_workflow_1 = require("n8n-workflow");
const node_assert_1 = __importStar(require("node:assert"));
const active_executions_1 = require("../active-executions");
const constants_2 = require("../constants");
const execution_crash_service_1 = require("../executions/execution-crash.service");
const execution_persistence_1 = require("../executions/execution-persistence");
const utils_1 = require("../utils");
const constants_3 = require("./constants");
const job_outcome_tracker_1 = require("./job-outcome-tracker");
const job_processor_1 = require("./job-processor");
const job_return_1 = require("./job-return");
const queue_name_1 = require("./queue-name");
const webhook_response_relay_1 = require("./webhook-response-relay");
const DRAIN_POLL_INTERVAL_MS = 500;
const CANCEL_WRITE_BUDGET_SHARE = 0.5;
const MAX_CANCEL_WRITE_TIMEOUT_MS = 3 * constants_1.Time.seconds.toMilliseconds;
const CURRENT_JOBS_SETTLE_TIMEOUT_MS = 5 * constants_1.Time.seconds.toMilliseconds;
let ScalingService = class ScalingService {
    constructor(logger, errorReporter, activeExecutions, jobProcessor, globalConfig, executionRepository, executionPersistence, instanceSettings, eventService, webhookResponseRelay, executionCrashService, jobOutcomeTracker) {
        this.logger = logger;
        this.errorReporter = errorReporter;
        this.activeExecutions = activeExecutions;
        this.jobProcessor = jobProcessor;
        this.globalConfig = globalConfig;
        this.executionRepository = executionRepository;
        this.executionPersistence = executionPersistence;
        this.instanceSettings = instanceSettings;
        this.eventService = eventService;
        this.webhookResponseRelay = webhookResponseRelay;
        this.executionCrashService = executionCrashService;
        this.jobOutcomeTracker = jobOutcomeTracker;
        this.queueByName = new Map();
        this.initialQueueName = queue_name_1.DEFAULT_QUEUE_NAME;
        this.stopping = false;
        this.jobCounters = { completed: 0, failed: 0 };
        this.queueRecoveryContext = {
            batchSize: this.globalConfig.executions.queueRecovery.batchSize,
            waitMs: this.globalConfig.executions.queueRecovery.interval * 60 * 1000,
        };
        this.logger = this.logger.scoped('scaling');
    }
    get defaultQueue() {
        const queue = this.queueByName.get(this.initialQueueName);
        if (!queue)
            throw new n8n_workflow_1.UnexpectedError('This method must be called after `setupQueue`');
        return queue;
    }
    async getOrCreateQueue(queueName) {
        const existing = this.queueByName.get(queueName);
        if (existing)
            return existing;
        if (!this.createBullQueue) {
            throw new n8n_workflow_1.UnexpectedError('This method must be called after `setupQueue`');
        }
        const queue = this.createBullQueue(queueName);
        this.registerListenersForQueue(queue);
        this.queueByName.set(queueName, queue);
        this.logger.debug(`Created queue "${queueName}"`);
        return queue;
    }
    async setupQueue() {
        if (this.queueByName.size > 0)
            return;
        const { default: BullQueue } = await import('bull');
        const { RedisClientService } = await import('@n8n/backend-services');
        const service = di_1.Container.get(RedisClientService);
        service.on('connection-recovered', () => {
            void this.jobOutcomeTracker.recheckAll();
        });
        const bullPrefix = this.globalConfig.queue.bull.prefix;
        const prefix = service.toValidPrefix(bullPrefix);
        const settings = { ...this.globalConfig.queue.bull.settings, maxStalledCount: 0 };
        this.createBullQueue = (name) => new BullQueue(name, {
            prefix,
            settings,
            createClient: (type) => service.createClient({ type: `${type}(bull)` }),
        });
        const poolName = (0, queue_name_1.resolveWorkerPoolName)(this.globalConfig.queue.workerPool);
        const queueName = (0, queue_name_1.resolveQueueName)(this.instanceSettings.instanceType, poolName);
        const queue = this.createBullQueue(queueName);
        this.registerListenersForQueue(queue);
        this.queueByName.set(queueName, queue);
        this.initialQueueName = queueName;
        this.logger.debug('Queue setup', {
            queueName,
            poolName,
            instanceType: this.instanceSettings.instanceType,
        });
        if (this.instanceSettings.isLeader)
            this.scheduleQueueRecovery(0);
        this.scheduleQueueMetrics();
        const { McpServer, QueuedExecutionStrategy, RedisSessionStore } = await import('@n8n/n8n-nodes-langchain/mcp/core');
        const { Publisher } = await import('../scaling/pubsub/publisher.service.js');
        const publisher = di_1.Container.get(Publisher);
        const MCP_SESSION_TTL = 86400;
        const getMcpSessionKey = (sessionId) => `${this.globalConfig.redis.prefix}:mcp-session:${sessionId}`;
        const mcpServer = McpServer.instance(this.logger);
        const redisStore = new RedisSessionStore({
            set: async (key, value, ttl) => await publisher.set(key, value, ttl),
            get: async (key) => await publisher.get(key),
            clear: async (key) => await publisher.clear(key),
        }, getMcpSessionKey, MCP_SESSION_TTL);
        mcpServer.setSessionStore(redisStore);
        mcpServer.setExecutionStrategy(new QueuedExecutionStrategy(mcpServer.getPendingCallsManager()));
        this.logger.debug('Queue setup completed');
    }
    setupWorker(concurrency) {
        this.assertWorker();
        this.assertQueue();
        void this.defaultQueue.process(constants_3.JOB_TYPE_NAME, concurrency, async (job) => {
            if (this.stopping) {
                const { executionId } = job.data;
                const jobId = job.id;
                this.logger.warn(`Worker received job ${jobId} for execution ${executionId} after it began to stop`, { executionId, jobId });
                await (0, job_return_1.throwJobBackToQueue)(job, this.logger);
            }
            try {
                this.eventService.emit('job-dequeued', {
                    executionId: job.data.executionId,
                    workflowId: job.data.workflowId,
                    hostId: this.instanceSettings.hostId,
                    jobId: job.id.toString(),
                });
                if (!this.hasValidJobData(job)) {
                    throw new n8n_workflow_1.UnexpectedError('Worker received invalid job', {
                        extra: { jobData: (0, n8n_workflow_1.jsonStringify)(job, { replaceCircularRefs: true }) },
                    });
                }
                await this.jobProcessor.processJob(job);
            }
            catch (error) {
                await this.reportJobProcessingError((0, ensure_error_1.ensureError)(error), job);
            }
        });
        this.logger.debug('Worker setup completed');
    }
    async reportJobProcessingError(error, job) {
        const { executionId } = job.data;
        this.logger.error(`Worker errored while running execution ${executionId} (job ${job.id})`, {
            error,
            executionId,
            jobId: job.id,
        });
        const msg = {
            kind: 'job-failed',
            executionId,
            workerId: this.instanceSettings.hostId,
            errorMsg: error.message,
            errorStack: error.stack ?? '',
        };
        try {
            await job.progress(msg);
        }
        catch (progressError) {
            this.logger.warn(`Failed to notify main of failed execution ${executionId} (job ${job.id})`, {
                error: progressError,
                executionId,
                jobId: job.id,
            });
        }
        this.errorReporter.error(error, { executionId });
        throw error;
    }
    async stop() {
        const { instanceType } = this.instanceSettings;
        if (instanceType === 'main')
            await this.stopMain();
        else if (instanceType === 'worker')
            await this.stopWorker();
    }
    async pauseAllQueues() {
        await Promise.all([...this.queueByName.values()].map(async (queue) => await queue.pause(true, true)));
        this.logger.debug('Paused all queues');
    }
    async stopMain() {
        if (this.instanceSettings.isSingleMain)
            await this.pauseAllQueues();
        if (this.queueRecoveryContext.timeout)
            this.stopQueueRecovery();
        if (this.isQueueMetricsEnabled)
            this.stopQueueMetrics();
    }
    async stopWorker() {
        this.stopping = true;
        const start = Date.now();
        await this.pauseAllQueues();
        const shutdownWindowMs = this.globalConfig.generic.gracefulShutdownTimeout * constants_1.Time.seconds.toMilliseconds;
        const drainTimeoutMs = shutdownWindowMs * 0.8;
        const hasQueuedJobsToDrain = () => this.getRunningJobsCount() !== 0;
        const hasInProcessExecutionsToDrain = () => this.activeExecutions.getRunningExecutionIds().length !== 0;
        const isWithinDrainBudget = () => Date.now() - start < drainTimeoutMs;
        const getRemainingWindowMs = () => Math.max(0, shutdownWindowMs - (Date.now() - start));
        if (this.globalConfig.queue.suspendExecutionsOnShutdown) {
            this.jobProcessor.suspendRunningJobs();
        }
        let count = 0;
        while (hasQueuedJobsToDrain() || (hasInProcessExecutionsToDrain() && isWithinDrainBudget())) {
            if (count++ % 4 === 0)
                this.logExecutionsToDrain();
            const remainingBudgetMs = drainTimeoutMs - (Date.now() - start);
            const sleepMs = hasQueuedJobsToDrain()
                ? DRAIN_POLL_INTERVAL_MS
                : Math.max(1, Math.min(DRAIN_POLL_INTERVAL_MS, remainingBudgetMs));
            await (0, sleep_1.sleep)(sleepMs);
        }
        await this.waitForCurrentQueueJobs(getRemainingWindowMs());
        if (drainTimeoutMs > 0 && hasInProcessExecutionsToDrain() && !isWithinDrainBudget()) {
            const elapsed = Math.round((Date.now() - start) / constants_1.Time.seconds.toMilliseconds);
            this.logger.warn(`Drain timeout reached after ${elapsed}s, shutting down with executions still active...`);
            this.logExecutionsToDrain();
            const remainingWindowMs = getRemainingWindowMs();
            const writeDeadlineMs = Math.min(MAX_CANCEL_WRITE_TIMEOUT_MS, Math.round(remainingWindowMs * CANCEL_WRITE_BUDGET_SHARE));
            const cancelledExecutionIds = await this.activeExecutions.cancelRunningExecutions(writeDeadlineMs);
            if (cancelledExecutionIds.length > 0) {
                this.logger.warn(`Cancelled ${cancelledExecutionIds.length} in-process executions that could not finish before shutdown (execution IDs: ${cancelledExecutionIds.join(', ')})`, { executionIds: cancelledExecutionIds });
            }
        }
    }
    async waitForCurrentQueueJobs(remainingWindowMs) {
        let timeout;
        const timedOut = new Promise((resolve) => {
            timeout = setTimeout(resolve, Math.min(CURRENT_JOBS_SETTLE_TIMEOUT_MS, remainingWindowMs / 2));
            timeout.unref();
        });
        const settled = Promise.all([...this.queueByName.values()].map(async (queue) => await queue.whenCurrentJobsFinished())).catch((error) => {
            this.logger.warn('Failed to wait for current queue jobs before stopping', { error });
        });
        try {
            await Promise.race([settled, timedOut]);
        }
        finally {
            clearTimeout(timeout);
        }
    }
    logExecutionsToDrain() {
        const summaries = this.jobProcessor.getRunningJobsSummary();
        const executionIds = summaries.map((summary) => summary.executionId);
        if (executionIds.length > 0) {
            this.logger.info(`Waiting for ${executionIds.length} active executions to finish... (execution IDs: ${executionIds.join(', ')})`, { executionIds });
        }
        const preflightExecutionIds = this.jobProcessor
            .getJobsInPreflight()
            .map(({ executionId }) => executionId);
        if (preflightExecutionIds.length > 0) {
            this.logger.info(`Waiting for ${preflightExecutionIds.length} executions to start... (execution IDs: ${preflightExecutionIds.join(', ')})`, { executionIds: preflightExecutionIds });
        }
        const inProcessExecutionIds = this.activeExecutions.getRunningExecutionIds();
        if (inProcessExecutionIds.length > 0) {
            this.logger.info(`Waiting for ${inProcessExecutionIds.length} in-process executions to finish... (execution IDs: ${inProcessExecutionIds.join(', ')})`, { executionIds: inProcessExecutionIds });
        }
    }
    async pingQueue() {
        await this.defaultQueue.client.ping();
    }
    popJobResult(job) {
        return this.jobOutcomeTracker.popResult(job);
    }
    async waitForJob(job) {
        await this.jobOutcomeTracker.waitFor(job);
    }
    async getPendingJobCounts() {
        let active = 0;
        let waiting = 0;
        for (const queue of this.queueByName.values()) {
            const counts = await queue.getJobCounts();
            active += counts.active;
            waiting += counts.waiting;
        }
        return { active, waiting };
    }
    async addJob(jobData, { priority, queueName }) {
        (0, node_assert_1.strict)(priority > 0 && priority <= Number.MAX_SAFE_INTEGER);
        const { keepLastCompleted, keepLastFailed } = this.globalConfig.executions.queueRetention;
        const jobOptions = {
            priority,
            removeOnComplete: keepLastCompleted,
            removeOnFail: keepLastFailed,
        };
        const targetQueue = queueName ? await this.getOrCreateQueue(queueName) : this.defaultQueue;
        const job = await targetQueue.add(constants_3.JOB_TYPE_NAME, jobData, jobOptions);
        const { executionId } = jobData;
        const jobId = job.id;
        this.logger.info(`Enqueued execution ${executionId} (job ${jobId})`, {
            executionId,
            jobId,
            ...(queueName && queueName !== queue_name_1.DEFAULT_QUEUE_NAME ? { queueName } : {}),
        });
        this.eventService.emit('job-enqueued', {
            executionId,
            workflowId: jobData.workflowId,
            hostId: this.instanceSettings.hostId,
            jobId: jobId.toString(),
        });
        return job;
    }
    async getJob(jobId) {
        for (const queue of this.queueByName.values()) {
            const job = await queue.getJob(jobId);
            if (job)
                return job;
        }
        return null;
    }
    async findJobsByStatus(statuses) {
        const allJobs = [];
        for (const queue of this.queueByName.values()) {
            const jobs = await queue.getJobs(statuses);
            allJobs.push(...jobs.filter((job) => job !== null));
        }
        return allJobs;
    }
    async stopJob(job) {
        const props = { jobId: job.id, executionId: job.data.executionId };
        this.jobOutcomeTracker.drop(job);
        try {
            if (await job.isActive()) {
                await job.progress({ kind: 'abort-job' });
                this.logger.debug('Sent abort signal to worker', props);
                return true;
            }
            await job.remove();
            this.logger.debug('Stopped inactive job', props);
            return true;
        }
        catch (error) {
            (0, node_assert_1.default)(error instanceof Error);
            this.logger.error('Failed to stop job', {
                ...props,
                error: {
                    message: error.message,
                    name: error.name,
                    stack: error.stack,
                },
            });
            return false;
        }
    }
    getRunningJobsCount() {
        return this.jobProcessor.getTrackedJobIds().length;
    }
    getDiagnosticCounts() {
        let queueListeners = 0;
        for (const queue of this.queueByName.values()) {
            for (const eventName of queue.eventNames()) {
                queueListeners += queue.listenerCount(eventName);
            }
        }
        return {
            ...this.jobOutcomeTracker.getDiagnosticCounts(),
            queueListeners,
            runningJobs: this.getRunningJobsCount(),
        };
    }
    registerListenersForQueue(queue) {
        const { instanceType } = this.instanceSettings;
        if (instanceType === 'main' || instanceType === 'webhook') {
            this.registerMainOrWebhookListeners(queue);
        }
        else if (instanceType === 'worker') {
            this.registerWorkerListeners(queue);
        }
    }
    registerWorkerListeners(queue) {
        queue.on('global:progress', (jobId, msg) => {
            if (!this.isJobMessage(msg))
                return;
            if (msg.kind === 'abort-job')
                this.jobProcessor.stopJob(jobId);
        });
        queue.on('error', (error) => {
            if ('code' in error && error.code === 'ECONNREFUSED')
                return;
            if (error.message.includes('Error initializing Lua scripts')) {
                this.logger.error('Fatal error initializing worker', { error });
                this.logger.error('Exiting process...');
                process.exit(1);
            }
            this.logger.error('Queue errored', { error });
            throw error;
        });
    }
    registerMainOrWebhookListeners(queue) {
        queue.on('error', (error) => {
            if ('code' in error && error.code === 'ECONNREFUSED')
                return;
            this.logger.error('Queue errored', { error });
            throw error;
        });
        queue.on('global:progress', (jobId, msg) => {
            if (!this.isJobMessage(msg))
                return;
            switch (msg.kind) {
                case 'send-chunk':
                    this.activeExecutions.sendChunk(msg.executionId, msg.chunkText);
                    break;
                case 'respond-to-webhook': {
                    const decodedResponse = (0, n8n_core_1.decodeBufferBody)(msg.response);
                    this.activeExecutions.resolveResponsePromise(msg.executionId, decodedResponse);
                    break;
                }
                case 'job-finished':
                    if (msg.success) {
                        this.activeExecutions.resolveResponsePromise(msg.executionId, {});
                    }
                    else {
                        this.activeExecutions.resolveResponsePromise(msg.executionId, {
                            body: {
                                message: 'Workflow execution failed',
                            },
                            statusCode: 500,
                        });
                    }
                    this.jobOutcomeTracker.recordFinished(queue.name, jobId, msg.executionId, msg.version === 2
                        ? {
                            success: msg.success,
                            error: msg.error,
                            status: msg.status,
                            lastNodeExecuted: msg.lastNodeExecuted,
                            usedDynamicCredentials: msg.usedDynamicCredentials,
                            metadata: msg.metadata,
                            startedAt: new Date(msg.startedAt),
                            stoppedAt: new Date(msg.stoppedAt),
                            waitTill: msg.waitTill ? new Date(msg.waitTill) : null,
                            nodeTimeSavedMinutes: msg.nodeTimeSavedMinutes,
                        }
                        : undefined);
                    this.logger.info(`Execution ${msg.executionId} (job ${jobId}) finished`, {
                        workerId: msg.workerId,
                        executionId: msg.executionId,
                        jobId,
                        success: msg.success,
                    });
                    break;
                case 'job-failed':
                    this.logger.error([
                        `Execution ${msg.executionId} (job ${jobId}) failed`,
                        msg.errorStack ? `\n${msg.errorStack}\n` : '',
                    ].join(''), {
                        workerId: msg.workerId,
                        errorMsg: msg.errorMsg,
                        executionId: msg.executionId,
                        jobId,
                    });
                    this.jobOutcomeTracker.recordFailed(queue.name, jobId, msg.executionId, new n8n_workflow_1.OperationalError(msg.errorMsg));
                    break;
                case 'abort-job':
                    break;
                case 'mcp-response':
                    void this.handleMcpResponse(msg.executionId, msg.mcpType, msg.sessionId, msg.messageId, msg.response);
                    break;
                default:
                    (0, utils_1.assertNever)(msg);
            }
        });
        queue.on('global:failed', (jobId, failedReason) => {
            this.jobOutcomeTracker.settleByJobKey(queue.name, jobId, new n8n_workflow_1.OperationalError(failedReason));
        });
        queue.on('global:completed', (jobId) => {
            this.jobOutcomeTracker.settleByJobKey(queue.name, jobId);
        });
        if (this.isQueueMetricsEnabled) {
            queue.on('global:completed', () => this.jobCounters.completed++);
            queue.on('global:failed', () => this.jobCounters.failed++);
        }
    }
    isJobMessage(candidate) {
        return typeof candidate === 'object' && candidate !== null && 'kind' in candidate;
    }
    async handleMcpResponse(executionId, mcpType, sessionId, messageId, response) {
        try {
            if (mcpType === 'service') {
                const executionData = await this.executionPersistence.findSingleExecution(executionId, {
                    includeData: true,
                    unflattenData: true,
                });
                if (!executionData) {
                    this.logger.error('Execution not found in DB for MCP response', { executionId });
                    return;
                }
                const runData = {
                    finished: executionData.finished,
                    mode: executionData.mode,
                    startedAt: executionData.startedAt,
                    stoppedAt: executionData.stoppedAt,
                    status: executionData.status,
                    data: executionData.data,
                    storedAt: executionData.storedAt,
                };
                const { McpService } = await import('../modules/mcp/mcp.service.js');
                const mcpService = di_1.Container.get(McpService);
                mcpService.handleWorkerResponse(executionId, runData);
            }
            else {
                const { McpServer } = await import('@n8n/n8n-nodes-langchain/mcp/core');
                const mcpServer = McpServer.instance(this.logger);
                const holdsResponse = mcpServer.hasSession(sessionId) || mcpServer.hasPendingResponse(sessionId, messageId);
                if (holdsResponse) {
                    const decoded = (0, n8n_core_1.decodeBufferBody)(response);
                    const toolResult = await this.webhookResponseRelay.restoreOffloadedBody(decoded, {
                        reclaim: false,
                        context: { executionId },
                    });
                    mcpServer.handleWorkerResponse(sessionId, messageId, toolResult);
                }
            }
        }
        catch (error) {
            this.logger.error('Failed to handle MCP response', {
                executionId,
                mcpType,
                error: (0, ensure_error_1.ensureError)(error).message,
            });
        }
    }
    assertQueue() {
        if (this.queueByName.size > 0)
            return;
        throw new n8n_workflow_1.UnexpectedError('This method must be called after `setupQueue`');
    }
    assertWorker() {
        if (this.instanceSettings.instanceType === 'worker')
            return;
        throw new n8n_workflow_1.UnexpectedError('This method must be called on a `worker` instance');
    }
    get isQueueMetricsEnabled() {
        return (this.globalConfig.endpoints.metrics.includeQueueMetrics &&
            this.instanceSettings.instanceType === 'main');
    }
    scheduleQueueMetrics() {
        if (!this.isQueueMetricsEnabled || this.queueMetricsInterval)
            return;
        this.queueMetricsInterval = setInterval(async () => {
            const pendingJobCounts = await this.getPendingJobCounts();
            this.eventService.emit('job-counts-updated', {
                ...pendingJobCounts,
                ...this.jobCounters,
            });
            this.jobCounters.completed = 0;
            this.jobCounters.failed = 0;
        }, this.globalConfig.endpoints.metrics.queueMetricsInterval * constants_1.Time.seconds.toMilliseconds);
    }
    stopQueueMetrics() {
        if (this.queueMetricsInterval) {
            clearInterval(this.queueMetricsInterval);
            this.queueMetricsInterval = undefined;
            this.logger.debug('Queue metrics collection stopped');
        }
    }
    scheduleQueueRecovery(waitMs = this.queueRecoveryContext.waitMs) {
        this.queueRecoveryContext.timeout = setTimeout(async () => {
            try {
                const nextWaitMs = await this.recoverFromQueue();
                this.scheduleQueueRecovery(nextWaitMs);
            }
            catch (error) {
                this.logger.error('Failed to recover dangling executions from queue', {
                    msg: this.toErrorMsg(error),
                });
                this.logger.error('Retrying...');
                this.scheduleQueueRecovery();
            }
        }, waitMs);
        if (waitMs === 0)
            return;
        const wait = [this.queueRecoveryContext.waitMs / constants_1.Time.minutes.toMilliseconds, 'min'].join(' ');
        this.logger.debug(`Scheduled queue recovery check for next ${wait}`);
    }
    stopQueueRecovery() {
        if (!this.queueRecoveryContext.timeout)
            return;
        clearTimeout(this.queueRecoveryContext.timeout);
        this.logger.debug('Queue recovery stopped');
    }
    async recoverFromQueue() {
        const { waitMs, batchSize } = this.queueRecoveryContext;
        const storedIds = await this.executionRepository.getInProgressExecutionIds(batchSize);
        if (storedIds.length === 0) {
            this.logger.debug('Completed queue recovery check, no dangling executions');
            return waitMs;
        }
        const runningJobs = await this.findJobsByStatus(['active', 'waiting']);
        const queuedIds = new Set(runningJobs.map((job) => job.data.executionId));
        const danglingIds = storedIds.filter((id) => !queuedIds.has(id));
        if (danglingIds.length === 0) {
            this.logger.debug('Completed queue recovery check, no dangling executions');
            return waitMs;
        }
        await this.executionCrashService.markAsCrashed(danglingIds, 'queue-recovery');
        this.logger.info('Completed queue recovery check, recovered dangling executions', {
            danglingIds,
        });
        return storedIds.length >= this.queueRecoveryContext.batchSize ? waitMs / 2 : waitMs;
    }
    toErrorMsg(error) {
        return error instanceof Error
            ? error.message
            : (0, n8n_workflow_1.jsonStringify)(error, { replaceCircularRefs: true });
    }
    hasValidJobData(job) {
        return (0, backend_common_1.isObjectLiteral)(job.data) && 'executionId' in job.data && 'loadStaticData' in job.data;
    }
};
exports.ScalingService = ScalingService;
__decorate([
    (0, decorators_1.OnShutdown)(constants_2.HIGHEST_SHUTDOWN_PRIORITY),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ScalingService.prototype, "stop", null);
__decorate([
    (0, decorators_1.OnLeaderTakeover)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ScalingService.prototype, "scheduleQueueRecovery", null);
__decorate([
    (0, decorators_1.OnLeaderStepdown)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ScalingService.prototype, "stopQueueRecovery", null);
exports.ScalingService = ScalingService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, n8n_core_1.ErrorReporter, active_executions_1.ActiveExecutions, job_processor_1.JobProcessor, config_1.GlobalConfig, db_1.ExecutionRepository, execution_persistence_1.ExecutionPersistence, n8n_core_1.InstanceSettings, backend_services_1.EventService, webhook_response_relay_1.WebhookResponseRelay, execution_crash_service_1.ExecutionCrashService, job_outcome_tracker_1.JobOutcomeTracker])
], ScalingService);
//# sourceMappingURL=scaling.service.js.map