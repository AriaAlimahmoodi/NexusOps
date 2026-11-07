"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializedWorkflowSchema = void 0;
const zod_1 = require("zod");
const credentialReferenceSchema = zod_1.z.object({
    id: zod_1.z.string().nullable(),
    name: zod_1.z.string(),
    __aiGatewayManaged: zod_1.z.boolean().optional(),
});
const nodeSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    type: zod_1.z.string().min(1),
    typeVersion: zod_1.z.number().finite(),
    position: zod_1.z.tuple([zod_1.z.number(), zod_1.z.number()]),
    parameters: zod_1.z.record(zod_1.z.unknown()),
    credentials: zod_1.z.record(credentialReferenceSchema).optional(),
    disabled: zod_1.z.boolean().optional(),
    notes: zod_1.z.string().optional(),
    notesInFlow: zod_1.z.boolean().optional(),
    continueOnFail: zod_1.z.boolean().optional(),
    retryOnFail: zod_1.z.boolean().optional(),
    maxTries: zod_1.z.number().optional(),
    waitBetweenTries: zod_1.z.number().optional(),
    alwaysOutputData: zod_1.z.boolean().optional(),
    executeOnce: zod_1.z.boolean().optional(),
    onError: zod_1.z.string().optional(),
    webhookId: zod_1.z.string().optional(),
});
const connectionLeafSchema = zod_1.z.object({
    node: zod_1.z.string(),
    type: zod_1.z.string(),
    index: zod_1.z.number(),
});
const connectionsSchema = zod_1.z.record(zod_1.z.record(zod_1.z.array(zod_1.z.array(connectionLeafSchema).nullable())));
const nodeGroupSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    nodeIds: zod_1.z.array(zod_1.z.string().min(1)),
    description: zod_1.z.string().optional(),
});
exports.serializedWorkflowSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    nodes: zod_1.z.array(nodeSchema),
    connections: connectionsSchema,
    nodeGroups: zod_1.z.array(nodeGroupSchema).optional(),
    settings: zod_1.z.record(zod_1.z.unknown()).optional(),
    parentFolderId: zod_1.z.string().nullable(),
    isArchived: zod_1.z.boolean(),
    tagIds: zod_1.z.array(zod_1.z.string().min(1)).optional(),
});
//# sourceMappingURL=workflow.schema.js.map