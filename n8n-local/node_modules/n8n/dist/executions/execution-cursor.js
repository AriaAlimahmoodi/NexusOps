"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseExecutionCursor = parseExecutionCursor;
exports.hasPosition = hasPosition;
exports.encodeExecutionCursor = encodeExecutionCursor;
const zod_1 = require("zod");
const errors_1 = require("@n8n/errors");
const timestamp = zod_1.z.string().datetime({ offset: true });
const V1_ID = zod_1.z
    .string()
    .regex(/^[1-9]\d*$/)
    .refine((id) => Number(id) <= 2147483647);
const Cursor = zod_1.z
    .object({
    version: zod_1.z.literal(1),
    v1: zod_1.z.object({ timestamp, id: V1_ID }).strict().optional(),
    v2: zod_1.z.object({ timestamp, id: zod_1.z.string().uuid() }).strict().optional(),
})
    .strict();
function parseExecutionCursor(value) {
    if (value === undefined)
        return { version: 1 };
    try {
        if (!value.length || value.length > 2048 || !/^[A-Za-z0-9_-]+$/.test(value)) {
            throw new errors_1.BadRequestError('Invalid execution cursor');
        }
        return Cursor.parse(JSON.parse(Buffer.from(value, 'base64url').toString('utf8')));
    }
    catch {
        throw new errors_1.BadRequestError('Invalid execution cursor');
    }
}
function hasPosition(cursor) {
    return cursor?.v1 !== undefined || cursor?.v2 !== undefined;
}
function encodeExecutionCursor(cursor) {
    return Buffer.from(JSON.stringify(cursor)).toString('base64url');
}
//# sourceMappingURL=execution-cursor.js.map