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
var PyTaskRunnerProcess_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PyTaskRunnerProcess = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const node_child_process_1 = require("node:child_process");
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
const node_util_1 = require("node:util");
const task_broker_auth_service_1 = require("./task-broker/auth/task-broker-auth.service");
const task_runner_lifecycle_events_1 = require("./task-runner-lifecycle-events");
const task_runner_process_base_1 = require("./task-runner-process-base");
const asyncExec = (0, node_util_1.promisify)(node_child_process_1.exec);
let PyTaskRunnerProcess = PyTaskRunnerProcess_1 = class PyTaskRunnerProcess extends task_runner_process_base_1.TaskRunnerProcessBase {
    constructor(logger, runnerConfig, authService, runnerLifecycleEvents) {
        super('task-runner-py', logger, runnerConfig, authService, runnerLifecycleEvents);
        this.name = 'runner:py';
    }
    startProcess(grantToken, taskBrokerUri, runnerId) {
        const pythonDir = node_path_1.default.join(__dirname, '../../../@n8n/task-runner-python');
        const venvPath = PyTaskRunnerProcess_1.getVenvPath();
        return (0, node_child_process_1.spawn)(venvPath, ['-m', 'src.main'], {
            cwd: pythonDir,
            env: Object.assign(Object.create(null), {
                PATH: process.env.PATH,
                HOME: process.env.HOME ?? process.env.USERPROFILE,
                N8N_RUNNERS_ID: runnerId,
                N8N_RUNNERS_GRANT_TOKEN: grantToken,
                N8N_RUNNERS_TASK_BROKER_URI: taskBrokerUri,
                N8N_RUNNERS_MAX_PAYLOAD: this.runnerConfig.maxPayload.toString(),
                N8N_RUNNERS_MAX_CONCURRENCY: this.runnerConfig.maxConcurrency.toString(),
                N8N_RUNNERS_TASK_TIMEOUT: this.runnerConfig.taskTimeout.toString(),
                N8N_RUNNERS_HEARTBEAT_INTERVAL: this.runnerConfig.heartbeatInterval.toString(),
                N8N_RUNNERS_STDLIB_ALLOW: process.env.N8N_RUNNERS_STDLIB_ALLOW,
                N8N_RUNNERS_EXTERNAL_ALLOW: process.env.N8N_RUNNERS_EXTERNAL_ALLOW,
                N8N_RUNNERS_ALLOW_TRANSITIVE_IMPORTS: process.env.N8N_RUNNERS_ALLOW_TRANSITIVE_IMPORTS,
                N8N_RUNNERS_BUILTINS_DENY: process.env.N8N_RUNNERS_BUILTINS_DENY,
                N8N_BLOCK_RUNNER_ENV_ACCESS: process.env.N8N_BLOCK_RUNNER_ENV_ACCESS,
            }),
        });
    }
    static async checkRequirements() {
        try {
            if (process.platform === 'win32') {
                const { stdout, stderr } = await asyncExec('python --version', { timeout: 5000 });
                const output = (stdout + stderr).trim();
                if (!output.startsWith('Python 3')) {
                    return 'python';
                }
            }
            else {
                await asyncExec('python3 --version', { timeout: 5000 });
            }
        }
        catch {
            return 'python';
        }
        try {
            await (0, promises_1.access)(PyTaskRunnerProcess_1.getVenvPath());
        }
        catch {
            return 'venv';
        }
        return null;
    }
    static getVenvPath() {
        const pythonDir = node_path_1.default.join(__dirname, '../../../@n8n/task-runner-python');
        const isWindows = process.platform === 'win32';
        const venvBin = isWindows ? 'Scripts' : 'bin';
        const pythonExe = isWindows ? 'python.exe' : 'python';
        return node_path_1.default.join(pythonDir, '.venv', venvBin, pythonExe);
    }
};
exports.PyTaskRunnerProcess = PyTaskRunnerProcess;
exports.PyTaskRunnerProcess = PyTaskRunnerProcess = PyTaskRunnerProcess_1 = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, config_1.TaskRunnersConfig, task_broker_auth_service_1.TaskBrokerAuthService, task_runner_lifecycle_events_1.TaskRunnerLifecycleEvents])
], PyTaskRunnerProcess);
//# sourceMappingURL=task-runner-process-py.js.map