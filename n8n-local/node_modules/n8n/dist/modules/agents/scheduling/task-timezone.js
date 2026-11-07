"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.knownTaskTimezone = knownTaskTimezone;
const api_types_1 = require("@n8n/api-types");
function knownTaskTimezone(timezone, taskId, logger) {
    if (!timezone)
        return null;
    if ((0, api_types_1.isValidTimeZone)(timezone))
        return timezone;
    logger.warn('Task has unknown timezone, using instance timezone', { taskId, timezone });
    return null;
}
//# sourceMappingURL=task-timezone.js.map