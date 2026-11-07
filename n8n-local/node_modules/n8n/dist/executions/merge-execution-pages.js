"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeExecutionPages = mergeExecutionPages;
const api_types_1 = require("@n8n/api-types");
const execution_cursor_1 = require("./execution-cursor");
const execution_id_1 = require("./execution-id");
function positionOf(item) {
    return {
        id: item.id,
        timestamp: new Date(item.startedAt ?? item.createdAt).toISOString(),
    };
}
function mergeExecutionPages(pages, limit, cursor) {
    const v1v2MergedAndSorted = pages.flatMap((page) => page.items).sort(api_types_1.compareExecutionListItems);
    const results = v1v2MergedAndSorted.slice(0, limit);
    const resultsReversed = Array.from(results).reverse();
    const lastIncludedV1 = resultsReversed.find((item) => !(0, execution_id_1.isExecutionIdV2)(item.id));
    const lastIncludedV2 = resultsReversed.find((item) => (0, execution_id_1.isExecutionIdV2)(item.id));
    const nextCursor = cursor ? { ...cursor } : { version: 1 };
    if (lastIncludedV1)
        nextCursor.v1 = positionOf(lastIncludedV1);
    if (lastIncludedV2)
        nextCursor.v2 = positionOf(lastIncludedV2);
    const hasMore = v1v2MergedAndSorted.length > limit || pages.some((page) => page.hasMore);
    return {
        results,
        nextCursor: hasMore && results.length ? (0, execution_cursor_1.encodeExecutionCursor)(nextCursor) : null,
    };
}
//# sourceMappingURL=merge-execution-pages.js.map