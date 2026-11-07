"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SIZE_THRESHOLD = void 0;
exports.parseFlatted = parseFlatted;
const flatted_1 = require("flatted");
const flatted_async_1 = require("./flatted-async");
exports.SIZE_THRESHOLD = 1 * 1024 * 1024;
async function parseFlatted(data) {
    if (data.length < exports.SIZE_THRESHOLD) {
        return (0, flatted_1.parse)(data);
    }
    return await (0, flatted_async_1.parseFlattedAsync)(data);
}
//# sourceMappingURL=parse-flatted.js.map