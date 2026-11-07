"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userSettingsSchema = exports.npsSurveySchema = exports.npsSurveyWaitingSchema = exports.npsSurveyRespondedSchema = void 0;
const zod_1 = require("zod");
exports.npsSurveyRespondedSchema = zod_1.z.object({
    lastShownAt: zod_1.z.number(),
    responded: zod_1.z.literal(true),
});
exports.npsSurveyWaitingSchema = zod_1.z.object({
    lastShownAt: zod_1.z.number(),
    waitingForResponse: zod_1.z.literal(true),
    ignoredCount: zod_1.z.number(),
});
exports.npsSurveySchema = zod_1.z.union([exports.npsSurveyRespondedSchema, exports.npsSurveyWaitingSchema]);
exports.userSettingsSchema = zod_1.z.object({
    isOnboarded: zod_1.z.boolean().optional(),
    firstSuccessfulWorkflowId: zod_1.z.string().optional(),
    userActivated: zod_1.z.boolean().optional(),
    userActivatedAt: zod_1.z.number().optional(),
    allowSSOManualLogin: zod_1.z.boolean().optional(),
    npsSurvey: exports.npsSurveySchema.optional(),
    easyAIWorkflowOnboarded: zod_1.z.boolean().optional(),
    userClaimedAiCredits: zod_1.z.boolean().optional(),
    dismissedCallouts: zod_1.z.record(zod_1.z.boolean()).optional(),
});
//# sourceMappingURL=user-settings.schema.js.map