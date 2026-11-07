"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodeNextCursor = exports.decodeCursor = void 0;
exports.resolveOffsetPagination = resolveOffsetPagination;
exports.paginateArray = paginateArray;
const n8n_workflow_1 = require("n8n-workflow");
const errors_1 = require("@n8n/errors");
const decodeCursor = (cursor) => {
    return (0, n8n_workflow_1.jsonParse)(Buffer.from(cursor, 'base64').toString());
};
exports.decodeCursor = decodeCursor;
function resolveOffsetPagination({ cursor, limit: queryLimit, offset: queryOffset, }) {
    let limit = queryLimit;
    let offset = queryOffset ?? 0;
    if (cursor) {
        try {
            const decoded = (0, exports.decodeCursor)(cursor);
            if (!('offset' in decoded)) {
                throw new errors_1.BadRequestError('An invalid cursor was provided');
            }
            offset = decoded.offset;
            limit = decoded.limit || queryLimit;
        }
        catch {
            throw new errors_1.BadRequestError('An invalid cursor was provided');
        }
    }
    return { offset, limit };
}
const encodeOffSetPagination = (pagination) => {
    if (pagination.numberOfTotalRecords > pagination.offset + pagination.limit) {
        return Buffer.from(JSON.stringify({
            limit: pagination.limit,
            offset: pagination.offset + pagination.limit,
        })).toString('base64');
    }
    return null;
};
const encodeCursorPagination = (pagination) => {
    if (pagination.numberOfNextRecords) {
        return Buffer.from(JSON.stringify({
            lastId: pagination.lastId,
            limit: pagination.limit,
        })).toString('base64');
    }
    return null;
};
const encodeNextCursor = (pagination) => {
    if ('offset' in pagination) {
        return encodeOffSetPagination(pagination);
    }
    return encodeCursorPagination(pagination);
};
exports.encodeNextCursor = encodeNextCursor;
function paginateArray(items, { offset, limit }) {
    return {
        data: items.slice(offset, offset + limit),
        nextCursor: (0, exports.encodeNextCursor)({
            offset,
            limit,
            numberOfTotalRecords: items.length,
        }),
    };
}
//# sourceMappingURL=pagination.service.js.map