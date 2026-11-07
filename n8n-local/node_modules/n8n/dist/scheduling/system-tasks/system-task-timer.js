"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemTaskTimer = void 0;
const constants_1 = require("@n8n/constants");
const scheduler_1 = require("@n8n/scheduler");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const n8n_workflow_1 = require("n8n-workflow");
const MAX_TIMEOUT_MS = 2 ** 31 - 1;
const MAX_WALKED_OCCURRENCES = 1_000;
class SystemTaskTimer {
    constructor(schedule, onFire, onPlanError, onPlan, now = Date.now) {
        this.schedule = schedule;
        this.onFire = onFire;
        this.onPlanError = onPlanError;
        this.onPlan = onPlan;
        this.now = now;
    }
    start(from) {
        this.stop();
        this.arm(from, true);
    }
    stop() {
        clearTimeout(this.timer);
        this.timer = undefined;
    }
    arm(after, isFirst) {
        let next;
        try {
            next = this.nextOccurrence(after, isFirst);
        }
        catch (error) {
            this.timer = undefined;
            this.onPlanError((0, ensure_error_1.ensureError)(error));
            return 0;
        }
        if (next === null) {
            this.timer = undefined;
            this.onPlanError(new n8n_workflow_1.UnexpectedError('A system task schedule has no next occurrence'));
            return 0;
        }
        const fireAtMs = next.getTime();
        if (!Number.isFinite(fireAtMs)) {
            this.timer = undefined;
            this.onPlanError(new n8n_workflow_1.UnexpectedError('A system task schedule plans past the representable date range'));
            return 0;
        }
        const nowMs = this.now();
        const delayMs = fireAtMs - nowMs;
        if (delayMs < 0) {
            const coalesced = this.countOccurrencesUpTo(next, nowMs);
            this.arm(new Date(nowMs), true);
            return coalesced;
        }
        this.waitFor(next, delayMs);
        this.onPlan(next);
        return 0;
    }
    nextOccurrence(after, isFirst) {
        if (this.schedule.kind === 'interval') {
            const intervalMs = this.schedule.intervalSeconds * constants_1.Time.seconds.toMilliseconds;
            if (!(intervalMs > 0)) {
                throw new n8n_workflow_1.UnexpectedError('A system task interval is not positive');
            }
            return new Date(after.getTime() + intervalMs);
        }
        return isFirst
            ? (0, scheduler_1.computeFirstRunAt)(this.schedule, after)
            : (0, scheduler_1.computeNextRunAt)(this.schedule, after);
    }
    countOccurrencesUpTo(first, untilMs) {
        const firstMs = first.getTime();
        if (untilMs < firstMs) {
            return 0;
        }
        if (this.schedule.kind === 'interval') {
            const intervalMs = this.schedule.intervalSeconds * constants_1.Time.seconds.toMilliseconds;
            return Math.floor((untilMs - firstMs) / intervalMs) + 1;
        }
        let count = 0;
        for (let next = first; next !== null && next.getTime() <= untilMs && count < MAX_WALKED_OCCURRENCES; next = (0, scheduler_1.computeNextRunAt)(this.schedule, next)) {
            count++;
        }
        return count;
    }
    waitFor(fireAt, delayMs) {
        if (delayMs > MAX_TIMEOUT_MS) {
            this.timer = setTimeout(() => this.waitFor(fireAt, fireAt.getTime() - this.now()), MAX_TIMEOUT_MS);
        }
        else {
            this.timer = setTimeout(() => {
                const lagMs = Math.max(0, this.now() - fireAt.getTime());
                const coalesced = this.arm(fireAt, false);
                this.onFire(lagMs, coalesced);
            }, Math.max(0, delayMs));
        }
        this.timer.unref();
    }
}
exports.SystemTaskTimer = SystemTaskTimer;
//# sourceMappingURL=system-task-timer.js.map