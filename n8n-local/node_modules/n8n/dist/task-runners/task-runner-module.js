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
exports.TaskRunnerModule = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const sleep_1 = require("@n8n/utils/sleep");
const n8n_core_1 = require("n8n-core");
const a = __importStar(require("node:assert/strict"));
const task_broker_ws_server_1 = require("../task-runners/task-broker/task-broker-ws-server");
const task_runner_process_restart_loop_detector_1 = require("../task-runners/task-runner-process-restart-loop-detector");
const missing_auth_token_error_1 = require("./errors/missing-auth-token.error");
const missing_requirements_error_1 = require("./errors/missing-requirements.error");
const task_requester_1 = require("./task-managers/task-requester");
let TaskRunnerModule = class TaskRunnerModule {
    constructor(logger, errorReporter, runnerConfig, eventService) {
        this.logger = logger;
        this.errorReporter = errorReporter;
        this.runnerConfig = runnerConfig;
        this.eventService = eventService;
        this.onRunnerRestartLoopDetected = async (error) => {
            this.logger.error(error.message);
            this.errorReporter.error(error);
            if (backend_common_1.inTest)
                return;
            await (0, sleep_1.sleep)(1000);
            process.exit(1);
        };
        this.logger = this.logger.scoped('task-runner');
    }
    async start() {
        const { mode, authToken } = this.runnerConfig;
        if (mode === 'external' && !authToken)
            throw new missing_auth_token_error_1.MissingAuthTokenError();
        await this.loadTaskRequester();
        await this.loadTaskBroker();
        this.eventService.on('execution-cancelled', ({ executionId }) => {
            this.taskRequester?.cancelTasks(executionId);
        });
        if (mode === 'internal')
            await this.startInternalTaskRunners();
    }
    async stop() {
        if (this.taskBrokerHttpServer) {
            await this.taskBrokerHttpServer.stop();
            this.taskBrokerHttpServer = undefined;
        }
        const stopRunnerProcessTask = (async () => {
            if (this.jsRunnerProcess) {
                await this.jsRunnerProcess.stop();
                this.jsRunnerProcess = undefined;
            }
        })();
        const stopPythonRunnerProcessTask = (async () => {
            if (this.pyRunnerProcess) {
                await this.pyRunnerProcess.stop();
                this.pyRunnerProcess = undefined;
            }
        })();
        await Promise.all([stopRunnerProcessTask, stopPythonRunnerProcessTask]);
    }
    async loadTaskRequester() {
        const { TaskRequester } = await import('../task-runners/task-managers/task-requester.js');
        const { LocalTaskRequester } = await import('../task-runners/task-managers/local-task-requester.js');
        this.taskRequester = di_1.Container.get(LocalTaskRequester);
        di_1.Container.set(TaskRequester, this.taskRequester);
    }
    async loadTaskBroker() {
        const { TaskBrokerServer } = await import('../task-runners/task-broker/task-broker-server.js');
        this.taskBrokerHttpServer = di_1.Container.get(TaskBrokerServer);
        this.taskBrokerWsServer = di_1.Container.get(task_broker_ws_server_1.TaskBrokerWsServer);
        await this.taskBrokerHttpServer.start();
    }
    async startInternalTaskRunners() {
        a.ok(this.taskBrokerWsServer, 'Task Runner WS Server not loaded');
        const { InternalTaskRunnerDisconnectAnalyzer } = await import('../task-runners/internal-task-runner-disconnect-analyzer.js');
        this.taskBrokerWsServer.setDisconnectAnalyzer(di_1.Container.get(InternalTaskRunnerDisconnectAnalyzer));
        const { JsTaskRunnerProcess } = await import('../task-runners/task-runner-process-js.js');
        this.jsRunnerProcess = di_1.Container.get(JsTaskRunnerProcess);
        this.jsRunnerProcessRestartLoopDetector = new task_runner_process_restart_loop_detector_1.TaskRunnerProcessRestartLoopDetector(this.jsRunnerProcess);
        this.jsRunnerProcessRestartLoopDetector.on('restart-loop-detected', this.onRunnerRestartLoopDetected);
        await this.jsRunnerProcess.start();
        const { PyTaskRunnerProcess } = await import('../task-runners/task-runner-process-py.js');
        const failureReason = await PyTaskRunnerProcess.checkRequirements();
        if (failureReason) {
            di_1.Container.get(task_requester_1.TaskRequester).setRunnerUnavailable('python', failureReason);
            const error = new missing_requirements_error_1.MissingRequirementsError(failureReason);
            this.logger.warn(error.message);
            return;
        }
        this.pyRunnerProcess = di_1.Container.get(PyTaskRunnerProcess);
        this.pyRunnerProcessRestartLoopDetector = new task_runner_process_restart_loop_detector_1.TaskRunnerProcessRestartLoopDetector(this.pyRunnerProcess);
        this.pyRunnerProcessRestartLoopDetector.on('restart-loop-detected', this.onRunnerRestartLoopDetected);
        await this.pyRunnerProcess.start();
    }
};
exports.TaskRunnerModule = TaskRunnerModule;
__decorate([
    (0, decorators_1.OnShutdown)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TaskRunnerModule.prototype, "stop", null);
exports.TaskRunnerModule = TaskRunnerModule = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, n8n_core_1.ErrorReporter, config_1.TaskRunnersConfig, backend_services_1.EventService])
], TaskRunnerModule);
//# sourceMappingURL=task-runner-module.js.map