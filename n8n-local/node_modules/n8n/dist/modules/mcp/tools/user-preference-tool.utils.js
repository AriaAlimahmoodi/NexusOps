"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.secondsSinceSaved = exports.savedPreferenceSchema = exports.PREFERENCE_WRITE_REASONS = void 0;
exports.classifyPreferenceWriteError = classifyPreferenceWriteError;
exports.toRejectedReason = toRejectedReason;
exports.preferencesSettingsUrl = preferencesSettingsUrl;
exports.toSavedPreferenceOutput = toSavedPreferenceOutput;
exports.preferenceScopeOf = preferenceScopeOf;
const api_types_1 = require("@n8n/api-types");
const zod_1 = __importDefault(require("zod"));
const errors_1 = require("@n8n/errors");
const ai_preference_write_1 = require("../../../services/ai-preference-write");
Object.defineProperty(exports, "secondsSinceSaved", { enumerable: true, get: function () { return ai_preference_write_1.secondsSinceSaved; } });
exports.PREFERENCE_WRITE_REASONS = [
    'too_long',
    'scope_full',
    'duplicate',
    'not_permitted',
    'blocked_by_admin',
    'failed',
    'not_found',
];
function classifyPreferenceWriteError(error) {
    if (error instanceof errors_1.NotFoundError)
        return { reason: 'not_found', message: error.message };
    return (0, ai_preference_write_1.toAiPreferenceWriteRejection)(error);
}
function toRejectedReason(reason) {
    return reason === 'not_found' ? 'not_permitted' : reason;
}
exports.savedPreferenceSchema = zod_1.default.object({
    id: zod_1.default.string().describe('Stable id. Pass it to update_user_preference or undo_user_preference.'),
    scope: zod_1.default
        .enum(['user', 'project', 'instance'])
        .describe('Who the preference applies to. Preferences saved over MCP are `user` scoped.'),
    text: zod_1.default.string().describe('The preference as it is now saved.'),
    url: zod_1.default.string().describe('Where the user can review, edit or delete it in n8n settings.'),
});
function preferencesSettingsUrl(urlService) {
    return `${urlService.getInstanceBaseUrl()}/settings/context/preferences`;
}
function toSavedPreferenceOutput(preference, url) {
    return {
        id: preference.id,
        scope: (0, api_types_1.aiPreferenceScopeOf)(preference),
        text: preference.content,
        url,
    };
}
function preferenceScopeOf(preference) {
    return (0, api_types_1.aiPreferenceScopeOf)(preference);
}
//# sourceMappingURL=user-preference-tool.utils.js.map