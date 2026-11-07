"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExecuteWorkflowCallExample = exports.getExpectedInputsDescription = exports.triggerRequiresInputs = exports.workflowInputsSchema = exports.webhookWorkflowInputSchema = exports.formWorkflowInputSchema = exports.chatWorkflowInputSchema = exports.webhookPayloadSchema = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = __importDefault(require("zod"));
exports.webhookPayloadSchema = zod_1.default
    .object({
    method: zod_1.default
        .enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'])
        .optional()
        .default('GET')
        .describe('HTTP method (defaults to GET)'),
    query: zod_1.default.record(zod_1.default.string()).optional().describe('Query string parameters'),
    body: zod_1.default.record(zod_1.default.unknown()).optional().describe('Request body data (main webhook payload)'),
    headers: zod_1.default
        .record(zod_1.default.string())
        .optional()
        .describe('HTTP headers (e.g., authorization, content-type)'),
})
    .strict()
    .describe('Input data for webhook-based workflows');
exports.chatWorkflowInputSchema = zod_1.default
    .object({
    chatInput: zod_1.default.string().describe('Input for chat-based workflows'),
})
    .strict();
exports.formWorkflowInputSchema = zod_1.default
    .object({
    formData: zod_1.default.record(zod_1.default.unknown()).describe('Input data for form-based workflows'),
})
    .strict();
exports.webhookWorkflowInputSchema = zod_1.default
    .object({
    webhookData: exports.webhookPayloadSchema,
})
    .strict();
exports.workflowInputsSchema = zod_1.default.union([
    exports.chatWorkflowInputSchema,
    exports.formWorkflowInputSchema,
    exports.webhookWorkflowInputSchema,
]);
const triggerRequiresInputs = (nodeType) => nodeType === n8n_workflow_1.CHAT_TRIGGER_NODE_TYPE ||
    nodeType === n8n_workflow_1.FORM_TRIGGER_NODE_TYPE ||
    nodeType === n8n_workflow_1.WEBHOOK_NODE_TYPE;
exports.triggerRequiresInputs = triggerRequiresInputs;
const getExpectedInputsDescription = (nodeType) => {
    switch (nodeType) {
        case n8n_workflow_1.CHAT_TRIGGER_NODE_TYPE:
            return '{ chatInput: string }';
        case n8n_workflow_1.FORM_TRIGGER_NODE_TYPE:
            return '{ formData: { FIELD_NAME: VALUE } }';
        case n8n_workflow_1.WEBHOOK_NODE_TYPE:
            return '{ webhookData: { headers?, query?, body? } }';
        case n8n_workflow_1.SCHEDULE_TRIGGER_NODE_TYPE:
        case n8n_workflow_1.MANUAL_TRIGGER_NODE_TYPE:
            return 'omit inputs';
        default:
            return 'omit inputs';
    }
};
exports.getExpectedInputsDescription = getExpectedInputsDescription;
const getExecuteWorkflowCallExample = (nodeType) => {
    switch (nodeType) {
        case n8n_workflow_1.CHAT_TRIGGER_NODE_TYPE:
            return '{ triggerNodeName: "<node name>", inputs: { chatInput: "<message>" } }';
        case n8n_workflow_1.FORM_TRIGGER_NODE_TYPE:
            return '{ triggerNodeName: "<node name>", inputs: { formData: { FIELD_NAME: VALUE } } }';
        case n8n_workflow_1.WEBHOOK_NODE_TYPE:
            return '{ triggerNodeName: "<node name>", inputs: { webhookData: { headers?, query?, body? } } }';
        case n8n_workflow_1.SCHEDULE_TRIGGER_NODE_TYPE:
        case n8n_workflow_1.MANUAL_TRIGGER_NODE_TYPE:
            return '{ triggerNodeName: "<node name>" }';
        default:
            return '{ triggerNodeName: "<node name>" }';
    }
};
exports.getExecuteWorkflowCallExample = getExecuteWorkflowCallExample;
//# sourceMappingURL=workflow-inputs.js.map