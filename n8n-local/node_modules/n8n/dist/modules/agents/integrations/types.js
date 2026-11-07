"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toInternalThreadId = exports.INTERNAL_THREAD_ID_SYMBOL = void 0;
exports.INTERNAL_THREAD_ID_SYMBOL = Symbol('internal-thread-id');
const toInternalThreadId = (id) => {
    return {
        [exports.INTERNAL_THREAD_ID_SYMBOL]: true,
        id,
    };
};
exports.toInternalThreadId = toInternalThreadId;
//# sourceMappingURL=types.js.map