"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveStoredConfig = resolveStoredConfig;
const api_types_1 = require("@n8n/api-types");
function resolveStoredConfig(row) {
    if (row.direction === 'apply') {
        const parsed = api_types_1.promotionGitApplySettingsSchema.safeParse(row.settings);
        return parsed.success ? { direction: 'apply', settings: parsed.data } : null;
    }
    const parsed = api_types_1.promotionGitPromoteSettingsSchema.safeParse(row.settings);
    return parsed.success ? { direction: 'promote', settings: parsed.data } : null;
}
//# sourceMappingURL=promotion-config-settings.js.map