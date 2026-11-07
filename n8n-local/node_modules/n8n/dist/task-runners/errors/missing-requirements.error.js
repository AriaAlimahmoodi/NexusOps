"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissingRequirementsError = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const ERROR_MESSAGE = 'Failed to start Python task runner in internal mode.';
const HINT = 'Launching a Python runner in internal mode is intended only for debugging and is not recommended for production. Users are encouraged to deploy in external mode. See: https://docs.n8n.io/hosting/configuration/task-runners/#setting-up-external-mode';
class MissingRequirementsError extends n8n_workflow_1.UserError {
    constructor(reasonId) {
        const reason = {
            python: 'because Python 3 is missing from this system.',
            venv: 'because its virtual environment is missing from this system.',
        }[reasonId];
        super([ERROR_MESSAGE, reason, HINT].join(' '));
    }
}
exports.MissingRequirementsError = MissingRequirementsError;
//# sourceMappingURL=missing-requirements.error.js.map