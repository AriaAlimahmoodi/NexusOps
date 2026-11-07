"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatValidationError = formatValidationError;
function formatValidationError(location, error) {
    const issue = error.errors[0];
    if (!issue)
        return 'Invalid request';
    if (issue.code === 'invalid_type' && issue.received === 'undefined' && issue.path.length > 0) {
        const parent = issue.path.slice(0, -1);
        const field = issue.path[issue.path.length - 1];
        const prefix = parent.length > 0 ? `/${parent.join('/')}` : '';
        return `request/${location}${prefix} must have required property '${field}'`;
    }
    const path = issue.path.length > 0 ? `/${issue.path.join('/')}` : '';
    return `request/${location}${path} ${issue.message}`;
}
//# sourceMappingURL=public-api-validation-error.js.map