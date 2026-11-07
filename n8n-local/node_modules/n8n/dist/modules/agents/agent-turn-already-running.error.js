"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentTurnAlreadyRunningError = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class AgentTurnAlreadyRunningError extends n8n_workflow_1.UserError {
    constructor() {
        super('A turn is already running in this conversation.');
    }
}
exports.AgentTurnAlreadyRunningError = AgentTurnAlreadyRunningError;
//# sourceMappingURL=agent-turn-already-running.error.js.map