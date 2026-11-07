"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompactionWindowDeltas = getCompactionWindowDeltas;
exports.isTrimmingEnabled = isTrimmingEnabled;
const constants_1 = require("@n8n/constants");
function getCompactionWindowDeltas(minimumAge, timeWindow, unitMs) {
    return { startDelta: (minimumAge + timeWindow) * unitMs, endDelta: minimumAge * unitMs };
}
function isTrimmingEnabled(workflowHistory, compaction) {
    return (workflowHistory.pruneTime === -1 ||
        workflowHistory.pruneTime * constants_1.Time.hours.toMilliseconds >=
            compaction.trimmingMinimumAgeDays * constants_1.Time.days.toMilliseconds);
}
//# sourceMappingURL=workflow-history-compaction.utils.js.map