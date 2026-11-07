"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseWorkflowMessage = exports.workflowMessageSchema = exports.agentWriteAccessHeartbeatMessageSchema = exports.agentWriteAccessReleaseRequestedMessageSchema = exports.agentWriteAccessRequestedMessageSchema = exports.agentClosedMessageSchema = exports.agentOpenedMessageSchema = exports.writeAccessHeartbeatMessageSchema = exports.writeAccessReleaseRequestedMessageSchema = exports.writeAccessRequestedMessageSchema = exports.workflowClosedMessageSchema = exports.workflowOpenedMessageSchema = void 0;
const zod_1 = require("zod");
exports.workflowOpenedMessageSchema = zod_1.z
    .object({
    type: zod_1.z.literal('workflowOpened'),
    workflowId: zod_1.z.string().min(1),
})
    .strict();
exports.workflowClosedMessageSchema = zod_1.z
    .object({
    type: zod_1.z.literal('workflowClosed'),
    workflowId: zod_1.z.string().min(1),
})
    .strict();
exports.writeAccessRequestedMessageSchema = zod_1.z
    .object({
    type: zod_1.z.literal('writeAccessRequested'),
    workflowId: zod_1.z.string().min(1),
    force: zod_1.z.boolean().optional(),
})
    .strict();
exports.writeAccessReleaseRequestedMessageSchema = zod_1.z
    .object({
    type: zod_1.z.literal('writeAccessReleaseRequested'),
    workflowId: zod_1.z.string().min(1),
})
    .strict();
exports.writeAccessHeartbeatMessageSchema = zod_1.z
    .object({
    type: zod_1.z.literal('writeAccessHeartbeat'),
    workflowId: zod_1.z.string().min(1),
})
    .strict();
exports.agentOpenedMessageSchema = zod_1.z
    .object({
    type: zod_1.z.literal('agentOpened'),
    agentId: zod_1.z.string().min(1),
})
    .strict();
exports.agentClosedMessageSchema = zod_1.z
    .object({
    type: zod_1.z.literal('agentClosed'),
    agentId: zod_1.z.string().min(1),
})
    .strict();
exports.agentWriteAccessRequestedMessageSchema = zod_1.z
    .object({
    type: zod_1.z.literal('agentWriteAccessRequested'),
    agentId: zod_1.z.string().min(1),
    force: zod_1.z.boolean().optional(),
})
    .strict();
exports.agentWriteAccessReleaseRequestedMessageSchema = zod_1.z
    .object({
    type: zod_1.z.literal('agentWriteAccessReleaseRequested'),
    agentId: zod_1.z.string().min(1),
})
    .strict();
exports.agentWriteAccessHeartbeatMessageSchema = zod_1.z
    .object({
    type: zod_1.z.literal('agentWriteAccessHeartbeat'),
    agentId: zod_1.z.string().min(1),
})
    .strict();
exports.workflowMessageSchema = zod_1.z.discriminatedUnion('type', [
    exports.workflowOpenedMessageSchema,
    exports.workflowClosedMessageSchema,
    exports.writeAccessRequestedMessageSchema,
    exports.writeAccessReleaseRequestedMessageSchema,
    exports.writeAccessHeartbeatMessageSchema,
    exports.agentOpenedMessageSchema,
    exports.agentClosedMessageSchema,
    exports.agentWriteAccessRequestedMessageSchema,
    exports.agentWriteAccessReleaseRequestedMessageSchema,
    exports.agentWriteAccessHeartbeatMessageSchema,
]);
const parseWorkflowMessage = async (msg) => {
    return await exports.workflowMessageSchema.parseAsync(msg);
};
exports.parseWorkflowMessage = parseWorkflowMessage;
//# sourceMappingURL=collaboration.message.js.map