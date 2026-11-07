"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logOptionsSchema = exports.clientOptionsSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("./constants");
const createEnumSchema = (enumObject, name) => {
    const values = Object.values(enumObject).filter((val) => typeof val === 'number');
    return zod_1.z.number().refine((val) => values.includes(val), {
        message: `Invalid ${name} value. Must be one of: ${values.join(', ')}`,
    });
};
exports.clientOptionsSchema = zod_1.z.object({
    syslogHostname: zod_1.z.string().optional(),
    port: zod_1.z.number().int().positive().max(65535).optional(),
    tcpTimeout: zod_1.z.number().int().positive().optional(),
    facility: createEnumSchema(constants_1.Facility, 'facility').optional(),
    severity: createEnumSchema(constants_1.Severity, 'severity').optional(),
    rfc3164: zod_1.z.boolean().optional(),
    appName: zod_1.z.string().max(48).optional(),
    dateFormatter: zod_1.z.function().args(zod_1.z.date()).returns(zod_1.z.string()).optional(),
    udpBindAddress: zod_1.z.string().ip().optional(),
    transport: createEnumSchema(constants_1.Transport, 'transport').optional(),
    tlsCA: zod_1.z
        .union([zod_1.z.string(), zod_1.z.array(zod_1.z.string()), zod_1.z.instanceof(Buffer), zod_1.z.array(zod_1.z.instanceof(Buffer))])
        .optional(),
});
exports.logOptionsSchema = zod_1.z.object({
    facility: createEnumSchema(constants_1.Facility, 'facility').optional(),
    severity: createEnumSchema(constants_1.Severity, 'severity').optional(),
    rfc3164: zod_1.z.boolean().optional(),
    appName: zod_1.z.string().max(48).optional(),
    syslogHostname: zod_1.z.string().optional(),
    timestamp: zod_1.z.instanceof(Date).optional(),
    msgid: zod_1.z.string().max(32).optional(),
});
//# sourceMappingURL=schemas.js.map