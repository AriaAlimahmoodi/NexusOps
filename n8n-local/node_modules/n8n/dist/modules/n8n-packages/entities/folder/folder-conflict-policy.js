"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decideMatchedFolder = decideMatchedFolder;
exports.removesUnpackagedWorkflows = removesUnpackagedWorkflows;
exports.resolveFolderConflictPolicy = resolveFolderConflictPolicy;
exports.folderPolicyRejection = folderPolicyRejection;
const n8n_packages_types_1 = require("../../n8n-packages.types");
const FOLDER_CONFLICT_POLICIES = {
    merge: { blocked: false },
    fail: { blocked: true },
    overwrite: { blocked: false },
};
function decideMatchedFolder(policy) {
    return FOLDER_CONFLICT_POLICIES[policy];
}
function removesUnpackagedWorkflows(policy) {
    return policy === n8n_packages_types_1.FolderConflictPolicy.Overwrite;
}
function resolveFolderConflictPolicy(request, packageShape) {
    if (request.folderConflictPolicy !== undefined)
        return request.folderConflictPolicy;
    return packageShape === 'project' ? request.projectConflictPolicy : n8n_packages_types_1.FolderConflictPolicy.Merge;
}
function folderPolicyRejection(request, packageShape) {
    if (packageShape === 'project') {
        return request.folderConflictPolicy === n8n_packages_types_1.FolderConflictPolicy.Overwrite &&
            request.projectConflictPolicy !== n8n_packages_types_1.ProjectConflictPolicy.Overwrite
            ? `folderConflictPolicy=overwrite removes workflows the package does not contain, so it requires projectConflictPolicy=overwrite (got "${request.projectConflictPolicy}").`
            : undefined;
    }
    return resolveFolderConflictPolicy(request, packageShape) === n8n_packages_types_1.FolderConflictPolicy.Overwrite
        ? 'folderConflictPolicy=overwrite is only supported for project packages, which describe the whole project scope. Use merge or fail.'
        : undefined;
}
//# sourceMappingURL=folder-conflict-policy.js.map