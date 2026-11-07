"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidCronExpression = isValidCronExpression;
const scheduler_1 = require("@n8n/scheduler");
const cron_1 = require("cron");
function isValidCronExpression(expression) {
    if (!(0, cron_1.validateCronExpression)(expression).valid)
        return false;
    try {
        (0, scheduler_1.computeFirstRunAt)({ kind: 'cron', cronExpression: expression, timezone: 'UTC' }, new Date());
        return true;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=cron-validation.js.map