"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleColumns = scheduleColumns;
exports.rowSchedule = rowSchedule;
const n8n_workflow_1 = require("n8n-workflow");
function scheduleColumns(schedule) {
    const empty = {
        cronExpression: null,
        timezone: null,
        recurrenceUnit: null,
        recurrenceSize: null,
        intervalSeconds: null,
        fireAt: null,
    };
    switch (schedule.kind) {
        case 'cron':
            return {
                ...empty,
                kind: schedule.kind,
                cronExpression: schedule.cronExpression,
                timezone: schedule.timezone,
            };
        case 'recurring_cron':
            return {
                ...empty,
                kind: schedule.kind,
                cronExpression: schedule.cronExpression,
                timezone: schedule.timezone,
                recurrenceUnit: schedule.recurrenceUnit,
                recurrenceSize: schedule.recurrenceSize,
            };
        case 'interval':
            return { ...empty, kind: schedule.kind, intervalSeconds: schedule.intervalSeconds };
        case 'one_off':
            return { ...empty, kind: schedule.kind, fireAt: schedule.fireAt };
    }
}
function rowSchedule(row) {
    switch (row.kind) {
        case 'cron':
            return { kind: 'cron', cronExpression: row.cronExpression ?? '', timezone: row.timezone };
        case 'recurring_cron':
            return {
                kind: 'recurring_cron',
                cronExpression: row.cronExpression ?? '',
                timezone: row.timezone,
                recurrenceUnit: row.recurrenceUnit ?? 'hours',
                recurrenceSize: row.recurrenceSize ?? 0,
            };
        case 'interval':
            return { kind: 'interval', intervalSeconds: row.intervalSeconds ?? 0 };
        case 'one_off':
            return { kind: 'one_off', fireAt: row.fireAt ?? new Date(0) };
        default: {
            const exhaustive = row.kind;
            throw new n8n_workflow_1.UnexpectedError(`Unexpected scheduled job kind: ${JSON.stringify(exhaustive)}`);
        }
    }
}
//# sourceMappingURL=schedule-columns.js.map