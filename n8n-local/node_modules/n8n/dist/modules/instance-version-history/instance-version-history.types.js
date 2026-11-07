"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatVersion = formatVersion;
exports.parseVersion = parseVersion;
exports.compareVersions = compareVersions;
exports.versionGte = versionGte;
const semver_1 = __importDefault(require("semver"));
function formatVersion(v) {
    return `${v.major}.${v.minor}.${v.patch}`;
}
function parseVersion(versionString) {
    const parsed = semver_1.default.parse(versionString);
    if (!parsed) {
        throw new Error(`Invalid version string: ${versionString}`);
    }
    return { major: parsed.major, minor: parsed.minor, patch: parsed.patch };
}
function compareVersions(a, b) {
    return semver_1.default.compare(formatVersion(a), formatVersion(b));
}
function versionGte(a, b) {
    return semver_1.default.gte(formatVersion(a), formatVersion(b));
}
//# sourceMappingURL=instance-version-history.types.js.map