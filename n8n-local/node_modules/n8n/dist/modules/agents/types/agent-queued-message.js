"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXECUTION_METADATA_KEY = exports.acceptsSteering = void 0;
exports.checkpointExecutionId = checkpointExecutionId;
const acceptsSteering = (kind) => kind === 'preview' || kind === 'n8n_chat' || kind === 'system';
exports.acceptsSteering = acceptsSteering;
exports.EXECUTION_METADATA_KEY = 'n8nExecutionId';
function checkpointExecutionId(state) {
    if (state.persistence?.delegated)
        return undefined;
    const id = state.persistence?.hostMetadata?.[exports.EXECUTION_METADATA_KEY];
    return typeof id === 'string' ? id : undefined;
}
//# sourceMappingURL=agent-queued-message.js.map