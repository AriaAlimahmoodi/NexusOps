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
exports.TaskRunnerProcessBase = exports.RUNNER_EXIT_GRACE_MS = void 0;
exports.restartRetryDelay = restartRetryDelay;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const sleep_1 = require("@n8n/utils/sleep");
const nanoid_1 = require("nanoid");
const strict_1 = __importDefault(require("node:assert/strict"));
const forward_to_logger_1 = require("./forward-to-logger");
const task_broker_auth_service_1 = require("./task-broker/auth/task-broker-auth.service");
const task_runner_lifecycle_events_1 = require("./task-runner-lifecycle-events");
const RESTART_RETRY_BASE_DELAY_MS = 5_000;
const RESTART_RETRY_MAX_DELAY_MS = 30_000;
exports.RUNNER_EXIT_GRACE_MS = 2_000;
function restartRetryDelay(attempt) {
    return Math.min(RESTART_RETRY_BASE_DELAY_MS * 2 ** (attempt - 1), RESTART_RETRY_MAX_DELAY_MS);
}
let TaskRunnerProcessBase = class TaskRunnerProcessBase extends backend_common_1.TypedEmitter {
    constructor(loggerScope, logger, runnerConfig, authService, runnerLifecycleEvents) {
        super();
        this.logger = logger;
        this.runnerConfig = runnerConfig;
        this.authService = authService;
        this.runnerLifecycleEvents = runnerLifecycleEvents;
        this.runnerId = null;
        this.process = null;
        this._runPromise = null;
        this.startPromise = null;
        this.isShuttingDown = false;
        this.logger = logger.scoped(loggerScope);
        this.runnerLifecycleEvents.on('runner:failed-heartbeat-check', ({ runnerId }) => {
            this.restartIfOwnRunner(runnerId, 'failed heartbeat check');
        });
        this.runnerLifecycleEvents.on('runner:timed-out-during-task', ({ runnerId }) => {
            this.restartIfOwnRunner(runnerId, 'timed out during task');
        });
        this.runnerLifecycleEvents.on('runner:unresponsive', ({ runnerId }) => {
            this.restartIfOwnRunner(runnerId, 'was reported unresponsive');
        });
    }
    restartIfOwnRunner(runnerId, cause) {
        if (runnerId === this.runnerId) {
            this.logger.warn(`Task runner ${cause}, restarting...`);
            void this.forceRestart();
        }
    }
    get isRunning() {
        return this.process !== null;
    }
    get pid() {
        return this.process?.pid;
    }
    get runPromise() {
        return this._runPromise;
    }
    get isInternal() {
        return this.runnerConfig.mode === 'internal';
    }
    async start() {
        (0, strict_1.default)(!this.process, `${this.name} already running`);
        this.isShuttingDown = false;
        this.startPromise = this.spawnAndMonitor();
        try {
            await this.startPromise;
        }
        finally {
            this.startPromise = null;
        }
    }
    async spawnAndMonitor() {
        this.runnerId = (0, nanoid_1.nanoid)();
        const grantToken = await this.authService.createGrantToken(this.runnerId);
        const taskBrokerUri = `http://127.0.0.1:${this.runnerConfig.port}`;
        const runnerProcess = this.startProcess(grantToken, taskBrokerUri, this.runnerId);
        try {
            (0, forward_to_logger_1.forwardToLogger)(this.logger, runnerProcess, `[${this.name}] `);
            this.monitorProcess(runnerProcess);
        }
        catch (error) {
            runnerProcess.kill();
            throw error;
        }
        this.process = runnerProcess;
    }
    async stop() {
        this.isShuttingDown = true;
        await this.startPromise?.catch(() => { });
        if (this.process) {
            this.process.kill();
            await Promise.race([this._runPromise, (0, sleep_1.sleep)(exports.RUNNER_EXIT_GRACE_MS)]);
            if (this.process) {
                this.process.kill('SIGKILL');
                await this._runPromise;
            }
        }
    }
    async forceRestart() {
        if (!this.isShuttingDown && this.process) {
            this.process.kill('SIGKILL');
            await this._runPromise;
        }
    }
    onProcessExit(code, resolveFn) {
        this.process = null;
        this.runnerId = null;
        const exitReason = this.analyzeExitReason?.(code) ?? { reason: 'unknown' };
        this.emit('exit', exitReason);
        resolveFn();
        if (!this.isShuttingDown) {
            setImmediate(async () => await this.startWithRetries());
        }
    }
    async startWithRetries() {
        let started = false;
        let failedAttempts = 0;
        while (!this.isShuttingDown && !started) {
            try {
                await this.start();
                started = true;
            }
            catch (error) {
                failedAttempts++;
                const delayMs = restartRetryDelay(failedAttempts);
                this.logger.error(`Failed to start ${this.name}, retrying in ${delayMs}ms`, { error });
                await (0, sleep_1.sleep)(delayMs);
            }
        }
    }
    monitorProcess(taskRunnerProcess) {
        this.setupProcessMonitoring?.(taskRunnerProcess);
        this._runPromise = new Promise((resolve) => {
            let exited = false;
            const onExit = (code) => {
                if (!exited) {
                    exited = true;
                    this.onProcessExit(code, resolve);
                }
            };
            taskRunnerProcess.on('exit', onExit);
            taskRunnerProcess.on('error', (error) => {
                this.logger.error(`${this.name} process errored`, { error });
                if (taskRunnerProcess.pid === undefined) {
                    onExit(null);
                }
            });
        });
    }
};
exports.TaskRunnerProcessBase = TaskRunnerProcessBase;
__decorate([
    (0, decorators_1.OnShutdown)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TaskRunnerProcessBase.prototype, "stop", null);
exports.TaskRunnerProcessBase = TaskRunnerProcessBase = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [String, backend_common_1.Logger, config_1.TaskRunnersConfig, task_broker_auth_service_1.TaskBrokerAuthService, task_runner_lifecycle_events_1.TaskRunnerLifecycleEvents])
], TaskRunnerProcessBase);
//# sourceMappingURL=task-runner-process-base.js.map