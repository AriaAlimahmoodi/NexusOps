"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toResponseExpectation = toResponseExpectation;
function toResponseExpectation(responseMode) {
    switch (responseMode) {
        case 'lastNode':
            return { kind: 'runEnd' };
        case 'responseNode':
            return { kind: 'stepResponse' };
        case 'streaming':
            return { kind: 'stream' };
        default:
            return { kind: 'none' };
    }
}
//# sourceMappingURL=engine-v2-response-expectation.js.map