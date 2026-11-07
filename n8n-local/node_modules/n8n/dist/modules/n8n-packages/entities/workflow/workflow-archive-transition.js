"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decideWorkflowArchiveTransition = decideWorkflowArchiveTransition;
function decideWorkflowArchiveTransition(packageArchived, existingArchived) {
    if (packageArchived === existingArchived)
        return null;
    return packageArchived ? 'archive' : 'unarchive';
}
//# sourceMappingURL=workflow-archive-transition.js.map