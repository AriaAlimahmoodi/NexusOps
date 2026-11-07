"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageExportBlockedError = exports.PackageEntityNotFoundError = exports.PackageEntityAccessDeniedError = void 0;
exports.assertEveryRequestedEntityAccessible = assertEveryRequestedEntityAccessible;
const n8n_workflow_1 = require("n8n-workflow");
class PackageEntityAccessDeniedError extends n8n_workflow_1.UserError {
}
exports.PackageEntityAccessDeniedError = PackageEntityAccessDeniedError;
class PackageEntityNotFoundError extends n8n_workflow_1.UserError {
}
exports.PackageEntityNotFoundError = PackageEntityNotFoundError;
class PackageExportBlockedError extends n8n_workflow_1.UserError {
}
exports.PackageExportBlockedError = PackageExportBlockedError;
async function assertEveryRequestedEntityAccessible(entityType, requestedIds, accessibleEntities, findExistingIdsWithoutAccessCheck) {
    const accessibleIds = new Set(accessibleEntities.map(({ id }) => id));
    const missingIds = requestedIds.filter((id) => !accessibleIds.has(id));
    if (missingIds.length === 0)
        return;
    const displayedIds = missingIds.slice(0, 20);
    const omittedCount = missingIds.length - displayedIds.length;
    const message = `${missingIds.length} ${entityType}(s) not found or not accessible. Export aborted.`;
    const description = `Missing ${entityType} IDs: ${displayedIds.join(', ')}${omittedCount > 0 ? `, and ${omittedCount} more` : ''}`;
    const existingMissingIds = await findExistingIdsWithoutAccessCheck(missingIds);
    if (existingMissingIds.size > 0) {
        throw new PackageEntityAccessDeniedError(message, { description });
    }
    throw new PackageEntityNotFoundError(message, { description });
}
//# sourceMappingURL=package-export.errors.js.map