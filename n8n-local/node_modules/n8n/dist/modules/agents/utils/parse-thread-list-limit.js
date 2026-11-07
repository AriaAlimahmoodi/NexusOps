"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseThreadListLimit = parseThreadListLimit;
function parseThreadListLimit(value) {
    return Math.min(Math.max(Math.trunc(Number(value)) || 20, 1), 100);
}
//# sourceMappingURL=parse-thread-list-limit.js.map