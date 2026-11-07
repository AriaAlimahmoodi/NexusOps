"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JOB_WAIT_RECHECK_INTERVAL_MS = exports.IMMEDIATE_COMMANDS = exports.SELF_SEND_COMMANDS = exports.MAX_PUBSUB_PAYLOAD_BYTES = exports.SUBSCRIBER_LIVENESS_TIMEOUT_MS = exports.SUBSCRIBER_LIVENESS_INTERVAL_MS = exports.MCP_RELAY_PUBSUB_CHANNEL = exports.WORKER_RESPONSE_PUBSUB_CHANNEL = exports.COMMAND_PUBSUB_CHANNEL = exports.JOB_TYPE_NAME = void 0;
const constants_1 = require("@n8n/constants");
exports.JOB_TYPE_NAME = 'job';
exports.COMMAND_PUBSUB_CHANNEL = 'n8n.commands';
exports.WORKER_RESPONSE_PUBSUB_CHANNEL = 'n8n.worker-response';
exports.MCP_RELAY_PUBSUB_CHANNEL = 'n8n.mcp-relay';
exports.SUBSCRIBER_LIVENESS_INTERVAL_MS = 30 * constants_1.Time.seconds.toMilliseconds;
exports.SUBSCRIBER_LIVENESS_TIMEOUT_MS = 10 * constants_1.Time.seconds.toMilliseconds;
exports.MAX_PUBSUB_PAYLOAD_BYTES = 5 * 1024 * 1024;
exports.SELF_SEND_COMMANDS = new Set([
    'add-webhooks-triggers-and-pollers',
    'remove-triggers-and-pollers',
    'workflow-publish-wake-up',
]);
exports.IMMEDIATE_COMMANDS = new Set([
    'add-webhooks-triggers-and-pollers',
    'remove-triggers-and-pollers',
    'relay-execution-lifecycle-event',
    'relay-chat-stream-event',
    'relay-agent-execution-update',
    'relay-agent-queued-chat',
    'cancel-agent-chat-execution',
    'relay-agent-message-queue-update',
    'relay-agent-background-tasks-update',
    'relay-agent-update',
    'resume-agent-workflow-tool',
    'cancel-agent-background-job',
    'wake-agent-background-job',
    'relay-instance-ai-event',
    'relay-instance-ai-task-control',
    'agent-chat-subscription-changed',
    'agent-chat-integration-changed',
    'agent-chat-leader-channel-request',
    'agent-chat-leader-channel-result',
    'cancel-test-run',
    'stop-execution',
    'display-workflow-activation',
    'display-workflow-deactivation',
    'display-workflow-activation-error',
    'display-workflow-publication-status',
    'workflow-publish-wake-up',
]);
exports.JOB_WAIT_RECHECK_INTERVAL_MS = 60 * constants_1.Time.seconds.toMilliseconds;
//# sourceMappingURL=constants.js.map