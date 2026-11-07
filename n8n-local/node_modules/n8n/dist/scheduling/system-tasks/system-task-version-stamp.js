"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.versionStamp = versionStamp;
exports.stampedByNewerVersion = stampedByNewerVersion;
const semver_1 = require("semver");
const constants_1 = require("../../constants");
function versionStamp() {
    return { n8nVersion: constants_1.N8N_VERSION };
}
function stampedByNewerVersion(payload) {
    const { n8nVersion } = payload;
    return (typeof n8nVersion === 'string' && (0, semver_1.valid)(n8nVersion) !== null && (0, semver_1.gt)(n8nVersion, constants_1.N8N_VERSION));
}
//# sourceMappingURL=system-task-version-stamp.js.map