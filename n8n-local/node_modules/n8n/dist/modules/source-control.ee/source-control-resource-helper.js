"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterByType = filterByType;
exports.getDeletedResources = getDeletedResources;
exports.getNonDeletedResources = getNonDeletedResources;
function filterByType(files, resourceType) {
    return files.filter((file) => file.type === resourceType);
}
function filterByStatus(files, resourceType, status) {
    return filterByType(files, resourceType).filter((file) => file.status === status);
}
function filterByStatusExcluding(files, resourceType, status) {
    return filterByType(files, resourceType).filter((file) => file.status !== status);
}
function getDeletedResources(files, resourceType) {
    return filterByStatus(files, resourceType, 'deleted');
}
function getNonDeletedResources(files, resourceType) {
    return filterByStatusExcluding(files, resourceType, 'deleted');
}
//# sourceMappingURL=source-control-resource-helper.js.map