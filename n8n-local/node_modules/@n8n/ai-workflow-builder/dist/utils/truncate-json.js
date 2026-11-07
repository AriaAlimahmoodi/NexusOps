"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.truncateJson = truncateJson;
const constants_1 = require("../constants");
function truncateJson(value, options = {}) {
    const { maxLength = constants_1.MAX_EXECUTION_DATA_CHARS, indent = 2 } = options;
    try {
        const result = JSON.stringify(value, null, indent);
        if (result.length <= maxLength) {
            return result;
        }
        return result.substring(0, maxLength) + '\n... (truncated)';
    }
    catch {
        return '[Unable to serialize data]';
    }
}
//# sourceMappingURL=truncate-json.js.map