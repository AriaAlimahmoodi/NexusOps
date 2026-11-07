"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toCommunityPackagePublic = toCommunityPackagePublic;
const api_types_1 = require("@n8n/api-types");
function toIsoString(value) {
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
function optionalString(value) {
    return typeof value === 'string' ? value : undefined;
}
function optionalBoolean(value) {
    return typeof value === 'boolean' ? value : undefined;
}
function stripInstalledNode(node) {
    const { package: _omitPackage, ...rest } = node;
    return rest;
}
function toCommunityPackagePublic(pkg) {
    return api_types_1.communityPackagePublicSchema.parse({
        packageName: pkg.packageName,
        installedVersion: pkg.installedVersion,
        authorName: optionalString(pkg.authorName),
        authorEmail: optionalString(pkg.authorEmail),
        installedNodes: pkg.installedNodes.map(stripInstalledNode),
        createdAt: toIsoString(pkg.createdAt),
        updatedAt: toIsoString(pkg.updatedAt),
        updateAvailable: optionalString(pkg.updateAvailable),
        failedLoading: optionalBoolean(pkg.failedLoading),
    });
}
//# sourceMappingURL=community-packages.mapper.js.map