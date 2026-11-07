"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toWorkflowOwner = toWorkflowOwner;
exports.canOwnFindings = canOwnFindings;
function toWorkflowOwner(user, source) {
    return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        source,
    };
}
function canOwnFindings(user) {
    return !user.disabled && !user.isPending;
}
//# sourceMappingURL=workflow-owner.js.map