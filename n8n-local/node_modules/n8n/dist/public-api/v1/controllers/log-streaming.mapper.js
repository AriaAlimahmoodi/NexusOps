"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toLogStreamingDestinationPublic = toLogStreamingDestinationPublic;
exports.toInternalDestinationOptions = toInternalDestinationOptions;
const api_types_1 = require("@n8n/api-types");
const INTERNAL_TO_PUBLIC = {
    ["$$MessageEventBusDestinationWebhook"]: 'webhook',
    ["$$MessageEventBusDestinationSyslog"]: 'syslog',
    ["$$MessageEventBusDestinationSentry"]: 'sentry',
};
const PUBLIC_TO_INTERNAL = {
    webhook: "$$MessageEventBusDestinationWebhook",
    syslog: "$$MessageEventBusDestinationSyslog",
    sentry: "$$MessageEventBusDestinationSentry",
};
function toLogStreamingDestinationPublic(options) {
    const type = options.__type ? INTERNAL_TO_PUBLIC[options.__type] : undefined;
    return api_types_1.LogStreamingDestinationPublicDto.parse({ ...options, type });
}
function toInternalDestinationOptions(input) {
    const { type, ...rest } = input;
    return { ...rest, __type: PUBLIC_TO_INTERNAL[type] };
}
//# sourceMappingURL=log-streaming.mapper.js.map