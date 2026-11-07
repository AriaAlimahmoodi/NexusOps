"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seededCron = seededCron;
const cron_1 = require("cron");
const node_crypto_1 = require("node:crypto");
function stableInt(seed, label, min, max) {
    const hash = (0, node_crypto_1.createHash)('sha256').update(`${seed}:${label}`).digest();
    return min + (hash.readUInt32BE(0) % (max - min));
}
function seededCron(item, seed) {
    if (item.mode === 'custom') {
        const trimmed = item.cronExpression.trim();
        const expression = trimmed.startsWith('@') ? new cron_1.CronTime(trimmed).toString() : trimmed;
        return (expression.split(/\s+/).length === 5 ? `0 ${expression}` : expression);
    }
    const second = stableInt(seed, 'second', 0, 60);
    switch (item.mode) {
        case 'everyMinute':
            return `${second} * * * * *`;
        case 'everyHour':
            return `${second} ${item.minute} * * * *`;
        case 'everyX': {
            if (item.unit === 'minutes')
                return `${second} */${item.value} * * * *`;
            const minute = stableInt(seed, 'minute', 0, 60);
            return `${second} ${minute} */${item.value} * * *`;
        }
        case 'everyDay':
            return `${second} ${item.minute} ${item.hour} * * *`;
        case 'everyWeek':
            return `${second} ${item.minute} ${item.hour} * * ${item.weekday}`;
        case 'everyMonth':
            return `${second} ${item.minute} ${item.hour} ${item.dayOfMonth} * *`;
    }
}
//# sourceMappingURL=seeded-cron.js.map