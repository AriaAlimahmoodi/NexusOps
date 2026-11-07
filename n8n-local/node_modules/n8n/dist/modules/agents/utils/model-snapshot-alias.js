"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SNAPSHOT_SUFFIX = void 0;
exports.stripSnapshotSuffix = stripSnapshotSuffix;
exports.SNAPSHOT_SUFFIX = /-(?:\d{8}|\d{4}-\d{2}-\d{2})$/;
function stripSnapshotSuffix(id) {
    return id.replace(exports.SNAPSHOT_SUFFIX, '');
}
//# sourceMappingURL=model-snapshot-alias.js.map