"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFailure = createFailure;
function createFailure(reference, kind) {
    return {
        kind,
        sourceId: reference.id,
        name: reference.name,
        type: reference.type,
    };
}
//# sourceMappingURL=credential.types.js.map