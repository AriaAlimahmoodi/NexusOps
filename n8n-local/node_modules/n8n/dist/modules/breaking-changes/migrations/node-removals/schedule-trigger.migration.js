"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cronToScheduleTrigger = void 0;
const node_crypto_1 = require("node:crypto");
const parameter_readers_1 = require("../parameter-readers");
const SCHEDULE_TRIGGER_TYPE = 'n8n-nodes-base.scheduleTrigger';
const SCHEDULE_TRIGGER_VERSION = 1.4;
const scheduleTrigger = (...intervals) => ({
    type: SCHEDULE_TRIGGER_TYPE,
    typeVersion: SCHEDULE_TRIGGER_VERSION,
    parameters: { rule: { interval: intervals } },
});
const spreadMinute = (seed) => (0, node_crypto_1.createHash)('sha256').update(seed).digest().readUInt32BE(0) % 60;
function cronItemToRule(item, seed) {
    const mode = (0, parameter_readers_1.readString)(item, 'mode', 'everyDay', 'Mode');
    const time = () => ({
        triggerAtHour: (0, parameter_readers_1.readInteger)(item, 'hour', 14, 'Hour', { min: 0, max: 23 }),
        triggerAtMinute: (0, parameter_readers_1.readInteger)(item, 'minute', 0, 'Minute', { min: 0, max: 59 }),
    });
    switch (mode) {
        case 'everyMinute':
            return { field: 'minutes', minutesInterval: 1 };
        case 'everyHour':
            return {
                field: 'hours',
                hoursInterval: 1,
                triggerAtMinute: (0, parameter_readers_1.readInteger)(item, 'minute', 0, 'Minute', { min: 0, max: 59 }),
            };
        case 'everyDay':
            return { field: 'days', daysInterval: 1, ...time() };
        case 'everyWeek':
            return {
                field: 'weeks',
                weeksInterval: 1,
                triggerAtDay: [(0, parameter_readers_1.readInteger)(item, 'weekday', 1, 'Weekday', { min: 0, max: 6 })],
                ...time(),
            };
        case 'everyMonth':
            return {
                field: 'months',
                monthsInterval: 1,
                triggerAtDayOfMonth: (0, parameter_readers_1.readInteger)(item, 'dayOfMonth', 1, 'Day of Month', {
                    min: 1,
                    max: 31,
                }),
                ...time(),
            };
        case 'everyX': {
            const unit = (0, parameter_readers_1.readString)(item, 'unit', 'hours', 'Unit');
            if (unit === 'minutes') {
                const value = (0, parameter_readers_1.readInteger)(item, 'value', 2, 'Value', { min: 1, max: 59 });
                return { field: 'minutes', minutesInterval: value };
            }
            if (unit === 'hours') {
                const value = (0, parameter_readers_1.readInteger)(item, 'value', 2, 'Value', { min: 1, max: 23 });
                return { field: 'hours', hoursInterval: value, triggerAtMinute: spreadMinute(seed) };
            }
            throw new Error(`Cron unit "${unit}" is not supported, so the node cannot be migrated.`);
        }
        case 'custom': {
            const expression = (0, parameter_readers_1.readString)(item, 'cronExpression', '* * * * * *', 'Cron Expression');
            return { field: 'cronExpression', expression: expression.trim() };
        }
        default:
            throw new Error(`Cron mode "${mode}" is not supported, so the node cannot be migrated.`);
    }
}
const hasUnevenStep = (rule) => (rule.field === 'minutes' &&
    typeof rule.minutesInterval === 'number' &&
    60 % rule.minutesInterval !== 0) ||
    (rule.field === 'hours' &&
        typeof rule.hoursInterval === 'number' &&
        24 % rule.hoursInterval !== 0);
const UNEVEN_STEP_NOTE = 'Cron ran an "Every X" schedule at fixed clock times, which did not repeat at an even gap. Schedule Trigger now repeats at an even gap from the first run, so the run times changed. Check the schedule.';
exports.cronToScheduleTrigger = {
    ruleId: 'cron-removed-v3',
    migrate: (node) => {
        const { triggerTimes } = node.parameters;
        const items = (0, parameter_readers_1.asParameters)(triggerTimes)?.item;
        const rules = Array.isArray(items) ? items.map(parameter_readers_1.asParameters) : [];
        if (rules.length === 0 || rules.includes(undefined)) {
            throw new Error('This Cron node has no trigger times, so it never fires. Add a schedule or remove the node before migrating.');
        }
        const migratedRules = rules.map((rule, index) => cronItemToRule(rule ?? {}, `${node.id}:${index}`));
        return {
            node: scheduleTrigger(...migratedRules),
            notes: migratedRules.some(hasUnevenStep) ? [UNEVEN_STEP_NOTE] : undefined,
        };
    },
};
//# sourceMappingURL=schedule-trigger.migration.js.map