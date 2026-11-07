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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsTaskRunnerProcess = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_child_process_1 = require("node:child_process");
const process = __importStar(require("node:process"));
const node_process_oom_detector_1 = require("./node-process-oom-detector");
const task_broker_auth_service_1 = require("./task-broker/auth/task-broker-auth.service");
const task_runner_lifecycle_events_1 = require("./task-runner-lifecycle-events");
const task_runner_process_base_1 = require("./task-runner-process-base");
let JsTaskRunnerProcess = class JsTaskRunnerProcess extends task_runner_process_base_1.TaskRunnerProcessBase {
    constructor(logger, runnerConfig, authService, runnerLifecycleEvents) {
        super('task-runner-js', logger, runnerConfig, authService, runnerLifecycleEvents);
        this.name = 'runner:js';
        this.oomDetector = null;
        (0, strict_1.default)(this.isInternal, `${this.constructor.name} cannot be used in external mode`);
    }
    startProcess(grantToken, taskBrokerUri, runnerId) {
        const startScript = require.resolve('@n8n/task-runner/start');
        const flags = this.runnerConfig.insecureMode
            ? []
            : ['--disallow-code-generation-from-strings', '--disable-proto=delete'];
        return (0, node_child_process_1.spawn)('node', [...flags, startScript], {
            env: this.getProcessEnvVars(grantToken, taskBrokerUri, runnerId),
        });
    }
    setupProcessMonitoring(process) {
        this.oomDetector = new node_process_oom_detector_1.NodeProcessOomDetector(process);
    }
    analyzeExitReason() {
        return { reason: this.oomDetector?.didProcessOom ? 'oom' : 'unknown' };
    }
    getProcessEnvVars(grantToken, taskBrokerUri, runnerId) {
        const envVars = Object.assign(Object.create(null), {
            PATH: process.env.PATH,
            HOME: process.env.HOME ?? process.env.USERPROFILE,
            NODE_PATH: process.env.NODE_PATH,
            GENERIC_TIMEZONE: process.env.GENERIC_TIMEZONE,
            NODE_FUNCTION_ALLOW_BUILTIN: process.env.NODE_FUNCTION_ALLOW_BUILTIN,
            NODE_FUNCTION_ALLOW_EXTERNAL: process.env.NODE_FUNCTION_ALLOW_EXTERNAL,
            N8N_SENTRY_DSN: process.env.N8N_SENTRY_DSN,
            N8N_VERSION: process.env.N8N_VERSION,
            ENVIRONMENT: process.env.ENVIRONMENT,
            DEPLOYMENT_NAME: process.env.DEPLOYMENT_NAME,
            N8N_RUNNERS_ID: runnerId,
            N8N_RUNNERS_GRANT_TOKEN: grantToken,
            N8N_RUNNERS_TASK_BROKER_URI: taskBrokerUri,
            N8N_RUNNERS_MAX_PAYLOAD: this.runnerConfig.maxPayload.toString(),
            N8N_RUNNERS_MAX_CONCURRENCY: this.runnerConfig.maxConcurrency.toString(),
            N8N_RUNNERS_TASK_TIMEOUT: this.runnerConfig.taskTimeout.toString(),
            N8N_RUNNERS_HEARTBEAT_INTERVAL: this.runnerConfig.heartbeatInterval.toString(),
            N8N_RUNNERS_INSECURE_MODE: process.env.N8N_RUNNERS_INSECURE_MODE,
            N8N_RUNNERS_GRACEFUL_SHUTDOWN_TIMEOUT: process.env.N8N_RUNNERS_GRACEFUL_SHUTDOWN_TIMEOUT,
            N8N_RUNNERS_SHUTDOWN_FORCE_KILL_MARGIN: process.env.N8N_RUNNERS_SHUTDOWN_FORCE_KILL_MARGIN,
        });
        if (this.runnerConfig.maxOldSpaceSize) {
            envVars.NODE_OPTIONS = `--max-old-space-size=${this.runnerConfig.maxOldSpaceSize}`;
        }
        return envVars;
    }
};
exports.JsTaskRunnerProcess = JsTaskRunnerProcess;
exports.JsTaskRunnerProcess = JsTaskRunnerProcess = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, config_1.TaskRunnersConfig, task_broker_auth_service_1.TaskBrokerAuthService, task_runner_lifecycle_events_1.TaskRunnerLifecycleEvents])
], JsTaskRunnerProcess);
//# sourceMappingURL=task-runner-process-js.js.map