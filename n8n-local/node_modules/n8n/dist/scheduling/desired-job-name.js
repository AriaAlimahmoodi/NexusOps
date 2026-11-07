"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nameDesiredJobs = nameDesiredJobs;
const scheduler_1 = require("@n8n/scheduler");
function nameDesiredJobs(workflowId, nodeId, schedules) {
    const seen = new Map();
    return schedules.map(({ schedule, firstRunAt }) => {
        const fingerprint = (0, scheduler_1.scheduleFingerprint)(schedule, firstRunAt !== null);
        const occurrence = seen.get(fingerprint) ?? 0;
        seen.set(fingerprint, occurrence + 1);
        return { name: `${workflowId}:${nodeId}:${fingerprint}:${occurrence}`, schedule, firstRunAt };
    });
}
//# sourceMappingURL=desired-job-name.js.map