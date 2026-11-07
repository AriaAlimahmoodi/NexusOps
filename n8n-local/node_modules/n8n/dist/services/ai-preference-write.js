"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toAiPreferenceWriteRejection = toAiPreferenceWriteRejection;
exports.isExpectedAiPreferenceRefusal = isExpectedAiPreferenceRefusal;
exports.secondsSinceSaved = secondsSinceSaved;
exports.writeAssistantPreference = writeAssistantPreference;
const telemetry_1 = require("@n8n/telemetry");
const errors_1 = require("@n8n/errors");
const ai_preference_scope_full_error_1 = require("../errors/response-errors/ai-preference-scope-full.error");
function toAiPreferenceWriteRejection(error) {
    if (error instanceof ai_preference_scope_full_error_1.AiPreferenceScopeFullError) {
        return { reason: 'scope_full', message: error.message, ...error.meta };
    }
    if (error instanceof errors_1.ConflictError)
        return { reason: 'duplicate', message: error.message };
    if (error instanceof errors_1.ForbiddenError)
        return { reason: 'not_permitted', message: error.message };
    if (isExpectedAiPreferenceRefusal(error))
        return { reason: 'failed', message: error.message };
    return { reason: 'failed', message: 'The preference could not be saved.' };
}
function isExpectedAiPreferenceRefusal(error) {
    return error instanceof errors_1.ResponseError && error.httpStatusCode < 500;
}
function secondsSinceSaved(preference, now = Date.now()) {
    return Math.max(0, Math.round((now - new Date(preference.createdAt).getTime()) / 1000));
}
async function writeAssistantPreference({ aiPreferenceService, telemetry, logger, user, surface, content, scope, }) {
    const textLength = content.length;
    let preference;
    try {
        preference = await aiPreferenceService.create(user, { content, scope }, surface);
    }
    catch (error) {
        const rejection = toAiPreferenceWriteRejection(error);
        if (!isExpectedAiPreferenceRefusal(error)) {
            logger.error('Saving an AI preference from the assistant failed', { error });
        }
        telemetry.track(telemetry_1.TELEMETRY_EVENT.CONTEXT.PREFERENCE_WRITE_REJECTED, {
            user_id: user.id,
            surface,
            reason: rejection.reason,
            scope_type: scope,
            text_length: textLength,
        });
        return { ok: false, ...rejection };
    }
    try {
        telemetry.track(telemetry_1.TELEMETRY_EVENT.CONTEXT.PREFERENCE_CONFIRMATION_SHOWN, {
            user_id: user.id,
            surface,
            scope_type: scope,
            text_length: textLength,
        });
        telemetry.track(telemetry_1.TELEMETRY_EVENT.CONTEXT.PREFERENCE_CONFIRMATION_RESOLVED, {
            user_id: user.id,
            surface,
            outcome: 'accepted',
            scope_type: scope,
            text_length: textLength,
        });
        telemetry.track(telemetry_1.TELEMETRY_EVENT.CONTEXT.PREFERENCE_SCOPE_ACCEPTED, {
            user_id: user.id,
            surface,
            offered_scope: scope,
            accepted_scope: scope,
            scope_changed: false,
        });
        telemetry.track(telemetry_1.TELEMETRY_EVENT.CONTEXT.ASSISTANT_SAVED_PREFERENCE, {
            user_id: user.id,
            surface,
            scope_type: scope,
            text_length: textLength,
            replaced_existing: false,
        });
    }
    catch (error) {
        logger.warn('Preference telemetry failed after the row was saved', { error });
    }
    return { ok: true, preference };
}
//# sourceMappingURL=ai-preference-write.js.map