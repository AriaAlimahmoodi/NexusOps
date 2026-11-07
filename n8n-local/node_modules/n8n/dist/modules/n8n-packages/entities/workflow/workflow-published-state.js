"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.derivePublishedState = derivePublishedState;
function derivePublishedState(metadata) {
    if (metadata.publishedVersionId === null)
        return false;
    return metadata.publishedVersionId === metadata.versionId ? true : undefined;
}
//# sourceMappingURL=workflow-published-state.js.map