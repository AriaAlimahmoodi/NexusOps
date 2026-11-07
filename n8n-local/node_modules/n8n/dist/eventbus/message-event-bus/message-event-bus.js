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
exports.MessageEventBus = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const events_1 = __importDefault(require("events"));
const uniqBy_1 = __importDefault(require("lodash/uniqBy"));
const n8n_core_1 = require("n8n-core");
const node_fs_1 = require("node:fs");
const execution_crash_service_1 = require("../../executions/execution-crash.service");
const execution_recovery_service_1 = require("../../executions/execution-recovery.service");
const event_message_ai_node_1 = require("../event-message-classes/event-message-ai-node");
const event_message_audit_1 = require("../event-message-classes/event-message-audit");
const event_message_execution_1 = require("../event-message-classes/event-message-execution");
const event_message_mcp_1 = require("../event-message-classes/event-message-mcp");
const event_message_node_1 = require("../event-message-classes/event-message-node");
const event_message_queue_1 = require("../event-message-classes/event-message-queue");
const event_message_runner_1 = require("../event-message-classes/event-message-runner");
const event_message_workflow_1 = require("../event-message-classes/event-message-workflow");
const message_event_bus_log_writer_1 = require("../message-event-bus-writer/message-event-bus-log-writer");
const resolve_event_log_path_1 = require("../message-event-bus-writer/resolve-event-log-path");
let MessageEventBus = class MessageEventBus extends events_1.default {
    constructor(logger, executionRepository, workflowRepository, recoveryService, executionCrashService, globalConfig, instanceSettings) {
        super();
        this.logger = logger;
        this.executionRepository = executionRepository;
        this.workflowRepository = workflowRepository;
        this.recoveryService = recoveryService;
        this.executionCrashService = executionCrashService;
        this.globalConfig = globalConfig;
        this.instanceSettings = instanceSettings;
        this.isInitialized = false;
    }
    async initialize(options) {
        if (this.isInitialized) {
            return;
        }
        this.logger.debug('Initializing event bus...');
        this.logger.debug('Initializing event writer');
        const processType = options?.workerId
            ? 'worker'
            : options?.webhookProcessorId
                ? 'webhook-processor'
                : 'main';
        const resolved = (0, resolve_event_log_path_1.resolveEventLogPath)({
            logFullPath: this.globalConfig.eventBus.logWriter.logFullPath,
            logBaseName: this.globalConfig.eventBus.logWriter.logBaseName,
            instanceDir: this.instanceSettings.n8nFolder,
            processType,
        });
        if (this.globalConfig.eventBus.logWriter.logFullPath) {
            this.warnIfDefaultLocationEventLogsCoexist(processType);
        }
        this.logWriter = await message_event_bus_log_writer_1.MessageEventBusLogWriter.getInstance({
            resolvedPath: { logFullBasePath: resolved.logFullBasePath },
        });
        if (!this.logWriter) {
            this.logger.warn('Could not initialize event writer');
        }
        await this.performStartupRecovery();
        this.logger.debug('MessageEventBus initialized');
        this.isInitialized = true;
    }
    warnIfDefaultLocationEventLogsCoexist(processType) {
        const { logFullBasePath: defaultBase, logFileName: defaultLogFile } = (0, resolve_event_log_path_1.resolveEventLogPath)({
            logFullPath: '',
            logBaseName: this.globalConfig.eventBus.logWriter.logBaseName,
            instanceDir: this.instanceSettings.n8nFolder,
            processType,
        });
        const candidates = [
            defaultLogFile,
            ...Array.from({ length: this.globalConfig.eventBus.logWriter.keepLogCount }, (_, i) => `${defaultBase}-${i + 1}.log`),
        ];
        const stale = candidates.filter((p) => (0, node_fs_1.existsSync)(p));
        if (stale.length > 0) {
            this.logger.warn(`N8N_EVENTBUS_LOGWRITER_LOGFULLPATH is set, but event log file(s) at the default location still exist: ${stale.join(', ')}. ` +
                'These files are no longer being written to and may contain unsent events from a previous run. ' +
                'Drain or relocate them as part of the migration.');
        }
    }
    async trySendingUnsent(msgs) {
        const unsentMessages = msgs ?? (await this.getEventsUnsent());
        if (unsentMessages.length > 0) {
            this.logger.debug(`Found unsent event messages: ${unsentMessages.length}`);
            for (const unsentMsg of unsentMessages) {
                this.logger.debug(`Retrying: ${unsentMsg.id} ${unsentMsg.__type}`);
                this.emitMessageWithCallback('message', unsentMsg);
            }
        }
    }
    async close() {
        this.logger.debug('Shutting down event writer...');
        await this.logWriter?.close();
        this.isInitialized = false;
        this.logger.debug('EventBus shut down.');
    }
    async send(msgs) {
        if (!Array.isArray(msgs)) {
            msgs = [msgs];
        }
        for (const msg of msgs) {
            this.logWriter?.putMessage(msg);
            this.emit('metrics.eventBus.event', msg);
            const hasDestinationListener = this.emitMessageWithCallback('message', msg);
            if (!hasDestinationListener) {
                this.confirmMessageDelivered(msg, { id: '0', name: 'eventBus' });
            }
        }
    }
    confirmMessageDelivered(msg, source) {
        this.logWriter?.confirmMessageSent(msg.id, source);
    }
    emitMessageWithCallback(eventName, msg) {
        const confirmCallback = (message, src) => this.confirmMessageDelivered(message, src);
        return this.emit(eventName, msg, confirmCallback);
    }
    async getEventsAll() {
        const queryResult = await this.logWriter?.getMessagesAll();
        const filtered = (0, uniqBy_1.default)(queryResult, 'id');
        return filtered;
    }
    async getEventsSent() {
        const queryResult = await this.logWriter?.getMessagesSent();
        const filtered = (0, uniqBy_1.default)(queryResult, 'id');
        return filtered;
    }
    async getEventsUnsent() {
        const queryResult = await this.logWriter?.getMessagesUnsent();
        const filtered = (0, uniqBy_1.default)(queryResult, 'id');
        return filtered;
    }
    async getUnfinishedExecutions() {
        const queryResult = await this.logWriter?.getUnfinishedExecutions();
        return queryResult;
    }
    async getUnsentAndUnfinishedExecutions() {
        const queryResult = await this.logWriter?.getUnsentAndUnfinishedExecutions();
        return queryResult;
    }
    async getEventsByExecutionId(executionId, logHistory) {
        const result = await this.logWriter?.getMessagesByExecutionId(executionId, logHistory);
        return result;
    }
    async sendAuditEvent(options) {
        await this.send(new event_message_audit_1.EventMessageAudit(options));
    }
    async sendWorkflowEvent(options) {
        await this.send(new event_message_workflow_1.EventMessageWorkflow(options));
    }
    async sendNodeEvent(options) {
        await this.send(new event_message_node_1.EventMessageNode(options));
    }
    async sendAiNodeEvent(options) {
        await this.send(new event_message_ai_node_1.EventMessageAiNode(options));
    }
    async sendExecutionEvent(options) {
        await this.send(new event_message_execution_1.EventMessageExecution(options));
    }
    async sendRunnerEvent(options) {
        await this.send(new event_message_runner_1.EventMessageRunner(options));
    }
    async sendQueueEvent(options) {
        await this.send(new event_message_queue_1.EventMessageQueue(options));
    }
    async sendMcpEvent(options) {
        await this.send(new event_message_mcp_1.EventMessageMcp(options));
    }
    async performStartupRecovery() {
        this.logger.debug('Checking for unsent event messages');
        const unsentAndUnfinished = await this.getUnsentAndUnfinishedExecutions();
        this.logger.debug(`Start logging into ${this.logWriter?.getLogFileName() ?? 'unknown filename'} `);
        this.logWriter?.startLogging();
        await this.send(unsentAndUnfinished.unsentMessages);
        const unfinishedExecutionIds = await this.collectUnfinishedExecutionIds(unsentAndUnfinished.unfinishedExecutions);
        if (unfinishedExecutionIds.length === 0) {
            return;
        }
        await this.logActiveWorkflows();
        const recoveryAlreadyAttempted = this.logWriter?.isRecoveryProcessRunning();
        if (recoveryAlreadyAttempted || this.globalConfig.eventBus.crashRecoveryMode === 'simple') {
            await this.executionCrashService.markAsCrashed(unfinishedExecutionIds, 'startup-recovery');
            if (recoveryAlreadyAttempted)
                this.logger.warn('Skipped recovery process since it previously failed.');
        }
        else {
            this.logWriter?.startRecoveryProcess();
            const recoveredIds = [];
            const crashedWorkflowIds = new Set();
            for (const executionId of unfinishedExecutionIds) {
                const logMessages = unsentAndUnfinished.unfinishedExecutions[executionId];
                const recoveredExecution = await this.recoveryService.recoverFromLogs(executionId, logMessages ?? []);
                if (recoveredExecution) {
                    if (recoveredExecution.status === 'crashed') {
                        crashedWorkflowIds.add(recoveredExecution.workflowId);
                    }
                    recoveredIds.push(executionId);
                }
            }
            if (recoveredIds.length > 0) {
                this.logger.warn(`Found unfinished executions: ${recoveredIds.join(', ')}`);
                this.logger.info('This could be due to a crash of an active workflow or a restart of n8n');
            }
            if (this.globalConfig.executions.recovery.workflowDeactivationEnabled &&
                crashedWorkflowIds.size > 0) {
                await this.recoveryService.autoDeactivateWorkflowsIfNeeded(crashedWorkflowIds);
            }
        }
        this.logWriter?.endRecoveryProcess();
    }
    async logActiveWorkflows() {
        const activeWorkflows = await this.workflowRepository.getWorkflowInfo({ activeOnly: true });
        if (activeWorkflows.length > 0) {
            this.logger.info('Currently active workflows:');
            for (const workflowData of activeWorkflows) {
                this.logger.info(`   - ${workflowData.name} (ID: ${workflowData.id})`);
            }
        }
    }
    async collectUnfinishedExecutionIds(unfinishedExecutions) {
        const unfinishedExecutionIds = Object.keys(unfinishedExecutions);
        if (this.globalConfig.executions.mode === 'queue') {
            return unfinishedExecutionIds;
        }
        const dbUnfinishedExecutionIds = await this.executionRepository.findUnfinishedIds();
        return Array.from(new Set([...unfinishedExecutionIds, ...dbUnfinishedExecutionIds]));
    }
};
exports.MessageEventBus = MessageEventBus;
exports.MessageEventBus = MessageEventBus = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, db_1.ExecutionRepository, db_1.WorkflowRepository, execution_recovery_service_1.ExecutionRecoveryService, execution_crash_service_1.ExecutionCrashService, config_1.GlobalConfig, n8n_core_1.InstanceSettings])
], MessageEventBus);
//# sourceMappingURL=message-event-bus.js.map