"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatTriggerParamsShape = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = require("zod");
const ChatTriggerResponseModeSchema = zod_1.z.enum([
    'streaming',
    'lastNode',
    'responseNode',
    'responseNodes',
]);
exports.chatTriggerParamsShape = zod_1.z.object({
    availableInChat: zod_1.z.boolean().optional().default(false),
    agentName: zod_1.z.string().min(1).optional(),
    agentDescription: zod_1.z.string().min(1).optional(),
    agentIcon: n8n_workflow_1.IconOrEmojiSchema.optional(),
    suggestedPrompts: zod_1.z
        .object({
        prompts: zod_1.z
            .array(zod_1.z.object({
            text: zod_1.z.string().min(1),
            icon: n8n_workflow_1.IconOrEmojiSchema.optional(),
        }))
            .optional(),
    })
        .optional(),
    options: zod_1.z
        .object({
        allowFileUploads: zod_1.z.boolean().optional(),
        allowedFilesMimeTypes: zod_1.z.string().optional(),
        responseMode: ChatTriggerResponseModeSchema.optional(),
        autoSaveHighlightedData: zod_1.z.boolean().optional(),
    })
        .optional(),
});
//# sourceMappingURL=chat-hub.types.js.map