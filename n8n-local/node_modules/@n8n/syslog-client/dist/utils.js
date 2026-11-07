"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isIPv6 = exports.buildFormattedMessage = exports.formatRfc3164Timestamp = exports.defaultDateFormatter = void 0;
const defaultDateFormatter = (date) => date.toISOString();
exports.defaultDateFormatter = defaultDateFormatter;
const formatRfc3164Timestamp = (date) => {
    const elements = date.toString().split(/\s+/);
    const month = elements[1];
    let day = elements[2];
    const time = elements[4];
    if (day[0] === '0') {
        day = ' ' + day.substring(1);
    }
    return `${month} ${day} ${time}`;
};
exports.formatRfc3164Timestamp = formatRfc3164Timestamp;
const buildFormattedMessage = (message, options, dateFormatter) => {
    const date = options.timestamp ?? new Date();
    const pri = options.facility * 8 + options.severity;
    const newline = message.endsWith('\n') ? '' : '\n';
    let formattedMessage;
    if (options.rfc3164) {
        const timestamp = (0, exports.formatRfc3164Timestamp)(date);
        formattedMessage = `<${pri}>${timestamp} ${options.syslogHostname} ${message}${newline}`;
    }
    else {
        const timestamp = dateFormatter(date);
        const msgid = options.msgid ?? '-';
        formattedMessage = `<${pri}>1 ${timestamp} ${options.syslogHostname} ${options.appName} ${process.pid} ${msgid} - ${message}${newline}`;
    }
    return Buffer.from(formattedMessage);
};
exports.buildFormattedMessage = buildFormattedMessage;
const isIPv6 = (address) => address.includes(':');
exports.isIPv6 = isIPv6;
//# sourceMappingURL=utils.js.map