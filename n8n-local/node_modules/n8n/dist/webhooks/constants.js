"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXECUTION_ENDED_WITHOUT_RESPONSE = exports.authAllowlistedNodes = exports.WEBHOOK_CONFLICT_MESSAGE = void 0;
const n8n_workflow_1 = require("n8n-workflow");
exports.WEBHOOK_CONFLICT_MESSAGE = 'There is a conflict with one of the webhooks.';
exports.authAllowlistedNodes = new Set([
    n8n_workflow_1.CHAT_TRIGGER_NODE_TYPE,
    n8n_workflow_1.FORM_TRIGGER_NODE_TYPE,
    n8n_workflow_1.FORM_NODE_TYPE,
]);
exports.EXECUTION_ENDED_WITHOUT_RESPONSE = Object.freeze({});
//# sourceMappingURL=constants.js.map