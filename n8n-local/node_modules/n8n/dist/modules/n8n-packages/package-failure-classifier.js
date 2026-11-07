"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyPackageFailure = classifyPackageFailure;
const n8n_workflow_1 = require("n8n-workflow");
const errors_1 = require("@n8n/errors");
const package_export_errors_1 = require("./entities/package-export.errors");
function classifyPackageFailure(error) {
    if (error instanceof package_export_errors_1.PackageEntityAccessDeniedError)
        return 'access-denied';
    if (error instanceof package_export_errors_1.PackageEntityNotFoundError)
        return 'entity-not-found';
    if (error instanceof package_export_errors_1.PackageExportBlockedError)
        return 'blocked';
    if (error instanceof errors_1.ForbiddenError)
        return 'access-denied';
    if (error instanceof errors_1.NotFoundError)
        return 'entity-not-found';
    if (error instanceof errors_1.ConflictError || error instanceof errors_1.UnprocessableRequestError) {
        return 'blocked';
    }
    if (error instanceof errors_1.BadRequestError)
        return 'validation';
    if (error instanceof n8n_workflow_1.UserError)
        return 'entity-not-found';
    return 'validation';
}
//# sourceMappingURL=package-failure-classifier.js.map