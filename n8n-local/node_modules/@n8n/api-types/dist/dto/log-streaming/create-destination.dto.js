"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateDestinationDto = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = require("zod");
exports.CreateDestinationDto = zod_1.z.discriminatedUnion('__type', [
    n8n_workflow_1.MessageEventBusDestinationWebhookOptionsSchema,
    n8n_workflow_1.MessageEventBusDestinationSentryOptionsSchema,
    n8n_workflow_1.MessageEventBusDestinationSyslogOptionsSchema,
]);
//# sourceMappingURL=create-destination.dto.js.map