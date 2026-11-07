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
exports.TaskBrokerWsServer = exports.SHUTDOWN_TASK_BUDGET_RATIO = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const sleep_1 = require("@n8n/utils/sleep");
const n8n_workflow_1 = require("n8n-workflow");
const constants_2 = require("../../constants");
const default_task_runner_disconnect_analyzer_1 = require("../../task-runners/default-task-runner-disconnect-analyzer");
const task_runner_lifecycle_events_1 = require("../../task-runners/task-runner-lifecycle-events");
const task_broker_service_1 = require("./task-broker.service");
function heartbeat() {
    this.isAlive = true;
}
exports.SHUTDOWN_TASK_BUDGET_RATIO = 0.8;
let TaskBrokerWsServer = class TaskBrokerWsServer {
    constructor(logger, taskBroker, disconnectAnalyzer, taskRunnersConfig, runnerLifecycleEvents, globalConfig, eventService) {
        this.logger = logger;
        this.taskBroker = taskBroker;
        this.disconnectAnalyzer = disconnectAnalyzer;
        this.taskRunnersConfig = taskRunnersConfig;
        this.runnerLifecycleEvents = runnerLifecycleEvents;
        this.globalConfig = globalConfig;
        this.eventService = eventService;
        this.runnerConnections = new Map();
        this.onRunnerUnresponsive = ({ runnerId, }) => {
            void this.removeConnection(runnerId, {
                reason: 'runner-unresponsive',
                code: constants_2.WsStatusCodes.CloseProtocolError,
            });
        };
    }
    start() {
        this.startHeartbeatChecks();
        this.runnerLifecycleEvents.on('runner:unresponsive', this.onRunnerUnresponsive);
    }
    startHeartbeatChecks() {
        const { heartbeatInterval } = this.taskRunnersConfig;
        if (heartbeatInterval <= 0) {
            throw new n8n_workflow_1.UserError('Heartbeat interval must be greater than 0');
        }
        this.heartbeatTimer = setInterval(() => this.checkConnectionLiveness(), heartbeatInterval * constants_1.Time.seconds.toMilliseconds);
    }
    checkConnectionLiveness() {
        for (const [runnerId, connection] of this.runnerConnections) {
            if (connection.isAlive) {
                connection.isAlive = false;
                connection.ping();
            }
            else {
                void this.removeConnection(runnerId, {
                    reason: 'failed-heartbeat-check',
                    code: constants_2.WsStatusCodes.CloseProtocolError,
                    expectedConnection: connection,
                });
                this.runnerLifecycleEvents.emit('runner:failed-heartbeat-check', { runnerId });
            }
        }
    }
    capTaskTimeoutsForShutdown() {
        const deadline = Date.now() +
            this.globalConfig.generic.gracefulShutdownTimeout *
                exports.SHUTDOWN_TASK_BUDGET_RATIO *
                constants_1.Time.seconds.toMilliseconds;
        this.taskBroker.capTaskTimeoutsForShutdown(deadline);
    }
    async stop() {
        this.runnerLifecycleEvents.off('runner:unresponsive', this.onRunnerUnresponsive);
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = undefined;
        }
        await this.stopConnectedRunners();
    }
    setDisconnectAnalyzer(disconnectAnalyzer) {
        this.disconnectAnalyzer = disconnectAnalyzer;
    }
    getDisconnectAnalyzer() {
        return this.disconnectAnalyzer;
    }
    sendMessage(id, message) {
        this.runnerConnections.get(id)?.send((0, n8n_workflow_1.jsonStringify)(message, { replaceCircularRefs: true }));
    }
    add(id, connection) {
        connection.isAlive = true;
        connection.on('pong', heartbeat);
        let isConnected = false;
        const onMessage = async (data) => {
            try {
                const buffer = Array.isArray(data)
                    ? Buffer.concat(data)
                    : data instanceof ArrayBuffer
                        ? Buffer.from(data)
                        : data;
                const message = JSON.parse(buffer.toString('utf8'));
                if (!isConnected) {
                    if (message.type === 'runner:info') {
                        if (this.hasLiveConnection(id)) {
                            this.logger.warn(`Runner "${message.name}" registered as "${id}", an ID another live runner holds, and replaced its connection. Give each runner a unique N8N_RUNNERS_ID, else they will keep evicting each other.`);
                        }
                        await this.removeConnection(id);
                        isConnected = true;
                        this.runnerConnections.set(id, connection);
                        this.taskBroker.registerRunner({
                            id,
                            taskTypes: message.types,
                            lastSeen: new Date(),
                            name: message.name,
                        }, this.sendMessage.bind(this, id), () => this.isRunnerReachable(id, connection));
                        this.logger.info(`Registered runner "${message.name}" (${id}) `);
                    }
                }
                else if (this.isCurrentConnection(id, connection)) {
                    void this.taskBroker.onRunnerMessage(id, message);
                }
            }
            catch (error) {
                this.logger.error(`Couldn't parse message from runner "${id}"`, {
                    error: error,
                    id,
                    data,
                });
            }
        };
        connection.once('close', async () => {
            connection.off('pong', heartbeat);
            connection.off('message', onMessage);
            await this.removeConnection(id, { expectedConnection: connection });
        });
        connection.on('message', onMessage);
        connection.send(JSON.stringify({ type: 'broker:inforequest' }));
    }
    async removeConnection(id, { reason = 'unknown', code = constants_2.WsStatusCodes.CloseNormal, expectedConnection, } = {}) {
        const connection = this.runnerConnections.get(id);
        const isStaleRemoval = expectedConnection !== undefined && !this.isCurrentConnection(id, expectedConnection);
        if (connection && !isStaleRemoval) {
            this.runnerConnections.delete(id);
            connection.close(code);
            if (reason === 'failed-heartbeat-check' || reason === 'runner-unresponsive') {
                this.eventService.emit('runner-disconnected', {
                    reason,
                    mode: this.taskRunnersConfig.mode,
                });
            }
            const inFlightTaskIds = this.taskBroker.getInFlightTaskIds(id);
            const disconnectError = await this.disconnectAnalyzer.toDisconnectError({
                runnerId: id,
                reason,
                heartbeatInterval: this.taskRunnersConfig.heartbeatInterval,
            });
            const hasReconnected = this.runnerConnections.has(id);
            if (hasReconnected) {
                this.taskBroker.failTasks(inFlightTaskIds, disconnectError);
            }
            else {
                this.taskBroker.deregisterRunner(id, disconnectError);
                this.logger.debug(`Deregistered runner "${id}"`);
            }
        }
    }
    handleRequest(req, _res) {
        this.add(req.query.id, req.ws);
    }
    isCurrentConnection(id, connection) {
        return this.runnerConnections.get(id) === connection;
    }
    isRunnerReachable(id, connection) {
        return this.isCurrentConnection(id, connection) && connection.readyState === connection.OPEN;
    }
    hasLiveConnection(id) {
        const connection = this.runnerConnections.get(id);
        return (connection !== undefined && connection.readyState === connection.OPEN && connection.isAlive);
    }
    async stopConnectedRunners() {
        await this.drainActiveTasks();
        await Promise.all(Array.from(this.runnerConnections.entries()).map(async ([id, connection]) => await this.removeConnection(id, {
            reason: 'shutting-down',
            code: constants_2.WsStatusCodes.CloseGoingAway,
            expectedConnection: connection,
        })));
    }
    async drainActiveTasks() {
        const drainTimeout = Math.floor(this.globalConfig.generic.gracefulShutdownTimeout * exports.SHUTDOWN_TASK_BUDGET_RATIO);
        const drainTimeoutMs = drainTimeout * constants_1.Time.seconds.toMilliseconds;
        this.taskBroker.startDraining();
        for (const connection of this.runnerConnections.values()) {
            try {
                connection.send(JSON.stringify({ type: 'broker:drain' }));
            }
            catch {
            }
        }
        const start = Date.now();
        while (this.taskBroker.hasActiveTasks() && Date.now() - start < drainTimeoutMs) {
            await (0, sleep_1.sleep)(100);
        }
        if (this.taskBroker.hasActiveTasks()) {
            this.logger.warn(`Drain timeout reached after ${drainTimeout}s, will force-shutdown with active tasks...`);
        }
    }
};
exports.TaskBrokerWsServer = TaskBrokerWsServer;
__decorate([
    (0, decorators_1.OnShutdown)(constants_2.HIGHEST_SHUTDOWN_PRIORITY),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TaskBrokerWsServer.prototype, "capTaskTimeoutsForShutdown", null);
exports.TaskBrokerWsServer = TaskBrokerWsServer = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, task_broker_service_1.TaskBroker, default_task_runner_disconnect_analyzer_1.DefaultTaskRunnerDisconnectAnalyzer, config_1.TaskRunnersConfig, task_runner_lifecycle_events_1.TaskRunnerLifecycleEvents, config_1.GlobalConfig, backend_services_1.EventService])
], TaskBrokerWsServer);
//# sourceMappingURL=task-broker-ws-server.js.map