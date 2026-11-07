"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unsupportedEphemeralNodeOperationMessage = exports.isUnsupportedEphemeralNodeOperation = void 0;
const api_types_1 = require("@n8n/api-types");
const UNSUPPORTED_EPHEMERAL_NODE_OPERATIONS = new Set(api_types_1.UNSUPPORTED_AGENT_NODE_TOOL_OPERATIONS);
const isUnsupportedEphemeralNodeOperation = (operation) => typeof operation === 'string' && UNSUPPORTED_EPHEMERAL_NODE_OPERATIONS.has(operation);
exports.isUnsupportedEphemeralNodeOperation = isUnsupportedEphemeralNodeOperation;
const unsupportedEphemeralNodeOperationMessage = (operation) => `Operation "${operation}" requires a persistent workflow and is not supported for agent tool execution. ` +
    'Choose a non-waiting operation. For human approval, configure the intended action and set ' +
    'requireApproval: true.';
exports.unsupportedEphemeralNodeOperationMessage = unsupportedEphemeralNodeOperationMessage;
//# sourceMappingURL=node-tool-operation-support.js.map