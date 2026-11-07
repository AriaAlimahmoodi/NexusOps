"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildResponseMetadata = buildResponseMetadata;
const buildSteps_1 = require("./buildSteps");
function buildResponseMetadata(response, itemIndex) {
    const currentIterationCount = response?.metadata?.iterationCount ?? 0;
    return {
        previousRequests: (0, buildSteps_1.buildSteps)(response, itemIndex),
        itemIndex,
        iterationCount: currentIterationCount + 1,
    };
}
//# sourceMappingURL=buildResponseMetadata.js.map