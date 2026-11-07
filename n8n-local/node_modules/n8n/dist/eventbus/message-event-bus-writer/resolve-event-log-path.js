"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveEventLogPath = resolveEventLogPath;
const backend_common_1 = require("@n8n/backend-common");
const n8n_workflow_1 = require("n8n-workflow");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const LOG_FILE_EXTENSION = '.log';
const ENV_VAR = 'N8N_EVENTBUS_LOGWRITER_LOGFULLPATH';
function resolveEventLogPath(input) {
    const { logFullPath, logBaseName, instanceDir, processType } = input;
    if (logFullPath) {
        if (!(0, node_path_1.isAbsolute)(logFullPath)) {
            throw new n8n_workflow_1.UserError(`${ENV_VAR} must be an absolute path, got: ${logFullPath}`);
        }
        if (!logFullPath.endsWith(LOG_FILE_EXTENSION)) {
            throw new n8n_workflow_1.UserError(`${ENV_VAR} must end in '${LOG_FILE_EXTENSION}', got: ${logFullPath}`);
        }
        const parent = (0, node_path_1.dirname)(logFullPath);
        if (!(0, node_fs_1.existsSync)(parent)) {
            (0, node_fs_1.mkdirSync)(parent, { recursive: true });
        }
        const logFullBasePath = logFullPath.slice(0, -LOG_FILE_EXTENSION.length);
        return { logFullBasePath, logFileName: logFullPath };
    }
    const suffix = processType === 'worker'
        ? '-worker'
        : processType === 'webhook-processor'
            ? '-webhook-processor'
            : '';
    const logFullBasePath = (0, backend_common_1.safeJoinPath)(instanceDir, `${logBaseName}${suffix}`);
    return { logFullBasePath, logFileName: `${logFullBasePath}${LOG_FILE_EXTENSION}` };
}
//# sourceMappingURL=resolve-event-log-path.js.map