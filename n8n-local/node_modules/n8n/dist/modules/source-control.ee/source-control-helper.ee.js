"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeCredentialData = sanitizeCredentialData;
exports.mergeRemoteCrendetialDataIntoLocalCredentialData = mergeRemoteCrendetialDataIntoLocalCredentialData;
exports.getWorkflowExportPath = getWorkflowExportPath;
exports.getProjectExportPath = getProjectExportPath;
exports.getCredentialExportPath = getCredentialExportPath;
exports.getDataTableExportPath = getDataTableExportPath;
exports.getVariablesPath = getVariablesPath;
exports.getTagsPath = getTagsPath;
exports.getFoldersPath = getFoldersPath;
exports.readTagAndMappingsFromSourceControlFile = readTagAndMappingsFromSourceControlFile;
exports.readFoldersFromSourceControlFile = readFoldersFromSourceControlFile;
exports.readDataTablesFromSourceControlFile = readDataTablesFromSourceControlFile;
exports.mapInBatches = mapInBatches;
exports.sourceControlFoldersExistCheck = sourceControlFoldersExistCheck;
exports.isSourceControlLicensed = isSourceControlLicensed;
exports.generateSshKeyPair = generateSshKeyPair;
exports.getRepoType = getRepoType;
exports.getTrackingInformationFromPullResult = getTrackingInformationFromPullResult;
exports.getTrackingInformationFromPrePushResult = getTrackingInformationFromPrePushResult;
exports.getTrackingInformationFromPostPushResult = getTrackingInformationFromPostPushResult;
exports.normalizeAndValidateSourceControlledFilePath = normalizeAndValidateSourceControlledFilePath;
exports.hasOwnerChanged = hasOwnerChanged;
exports.isWorkflowModified = isWorkflowModified;
exports.isDataTableModified = isDataTableModified;
exports.getDataTableColumnKey = getDataTableColumnKey;
exports.isValidDataTableColumnType = isValidDataTableColumnType;
exports.areSameCredentials = areSameCredentials;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const fs_1 = require("fs");
const chunk_1 = __importDefault(require("lodash/chunk"));
const isEqual_1 = __importDefault(require("lodash/isEqual"));
const n8n_workflow_1 = require("n8n-workflow");
const strict_1 = require("node:assert/strict");
const promises_1 = require("node:fs/promises");
const path_1 = __importDefault(require("path"));
const credential_data_merge_1 = require("../../credentials/credential-data-merge");
const license_1 = require("../../license");
const promotions_git_utils_1 = require("../../modules/promotions.ee/promotions-git.utils");
const utils_1 = require("../../utils");
const constants_1 = require("./constants");
function sanitizeCredentialData(data) {
    const result = (0, n8n_workflow_1.deepCopy)(data);
    for (const [key, value] of Object.entries(data)) {
        if (value === null || key === 'oauthTokenData') {
            delete result[key];
        }
        else if (typeof value === 'object') {
            result[key] = sanitizeCredentialData(value);
        }
        else if (typeof value === 'string') {
            result[key] = (0, utils_1.containsExpression)(value) ? value : '';
        }
    }
    return result;
}
function mergeRemoteCrendetialDataIntoLocalCredentialData({ local, remote, }) {
    return (0, credential_data_merge_1.mergeCredentialData)({
        existing: local,
        incoming: sanitizeCredentialData(remote),
        arrays: 'merge-by-index',
    });
}
function getWorkflowExportPath(workflowId, workflowExportFolder) {
    return (0, backend_common_1.safeJoinPath)(workflowExportFolder, `${workflowId}.json`);
}
function getProjectExportPath(projectId, projectExportFolder) {
    return (0, backend_common_1.safeJoinPath)(projectExportFolder, `${projectId}.json`);
}
function getCredentialExportPath(credentialId, credentialExportFolder) {
    return (0, backend_common_1.safeJoinPath)(credentialExportFolder, `${credentialId}.json`);
}
function getDataTableExportPath(dataTableId, dataTableExportFolder) {
    return (0, backend_common_1.safeJoinPath)(dataTableExportFolder, `${dataTableId}.json`);
}
function getVariablesPath(gitFolder) {
    return (0, backend_common_1.safeJoinPath)(gitFolder, constants_1.SOURCE_CONTROL_VARIABLES_EXPORT_FILE);
}
function getTagsPath(gitFolder) {
    return (0, backend_common_1.safeJoinPath)(gitFolder, constants_1.SOURCE_CONTROL_TAGS_EXPORT_FILE);
}
function getFoldersPath(gitFolder) {
    return (0, backend_common_1.safeJoinPath)(gitFolder, constants_1.SOURCE_CONTROL_FOLDERS_EXPORT_FILE);
}
async function readTagAndMappingsFromSourceControlFile(file) {
    try {
        return (0, n8n_workflow_1.jsonParse)(await (0, promises_1.readFile)(file, { encoding: 'utf8' }), { fallbackValue: { tags: [], mappings: [] } });
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            return { tags: [], mappings: [] };
        }
        throw error;
    }
}
function isErrnoException(error) {
    return (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string');
}
async function readFoldersFromSourceControlFile(file) {
    try {
        return (0, n8n_workflow_1.jsonParse)(await (0, promises_1.readFile)(file, { encoding: 'utf8' }), {
            fallbackValue: { folders: [] },
        });
    }
    catch (error) {
        if (isErrnoException(error) && error.code === 'ENOENT') {
            return { folders: [] };
        }
        throw error;
    }
}
async function readDataTablesFromSourceControlFile(file) {
    try {
        return (0, n8n_workflow_1.jsonParse)(await (0, promises_1.readFile)(file, { encoding: 'utf8' }), {
            fallbackValue: [],
        });
    }
    catch (error) {
        if (isErrnoException(error) && error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}
async function mapInBatches(items, batchSize, fn) {
    const results = [];
    for (const batch of (0, chunk_1.default)(items, batchSize)) {
        results.push(...(await Promise.all(batch.map(fn))));
    }
    return results;
}
function sourceControlFoldersExistCheck(folders, createIfNotExists = true) {
    let existed = true;
    folders.forEach((folder) => {
        try {
            (0, fs_1.accessSync)(folder, fs_1.constants.F_OK);
        }
        catch {
            existed = false;
            if (createIfNotExists) {
                try {
                    (0, fs_1.mkdirSync)(folder, { recursive: true });
                }
                catch (error) {
                    di_1.Container.get(backend_common_1.Logger).error(error.message);
                }
            }
        }
    });
    return existed;
}
function isSourceControlLicensed() {
    const license = di_1.Container.get(license_1.License);
    return license.isSourceControlLicensed();
}
async function generateSshKeyPair(keyType) {
    return await (0, promotions_git_utils_1.generateSshKeyPair)(keyType, constants_1.SOURCE_CONTROL_GIT_KEY_COMMENT);
}
function getRepoType(repoUrl) {
    if (repoUrl.includes('github.com')) {
        return 'github';
    }
    else if (repoUrl.includes('gitlab.com')) {
        return 'gitlab';
    }
    return 'other';
}
function filterSourceControlledFilesUniqueIds(files) {
    if (!files || !Array.isArray(files)) {
        return [];
    }
    return files.filter((file, index, self) => {
        return self.findIndex((f) => f.id === file.id) === index;
    });
}
function getTrackingInformationFromPullResult(userId, result) {
    const uniques = filterSourceControlledFilesUniqueIds(result);
    return {
        userId,
        credConflicts: uniques.filter((file) => file.type === 'credential' && file.status === 'modified' && file.location === 'local').length,
        workflowConflicts: uniques.filter((file) => file.type === 'workflow' && file.status === 'modified' && file.location === 'local').length,
        workflowUpdates: uniques.filter((file) => file.type === 'workflow').length,
    };
}
function getTrackingInformationFromPrePushResult(userId, result) {
    const uniques = filterSourceControlledFilesUniqueIds(result);
    return {
        userId,
        workflowsEligible: uniques.filter((file) => file.type === 'workflow').length,
        workflowsEligibleWithConflicts: uniques.filter((file) => file.type === 'workflow' && file.conflict).length,
        credsEligible: uniques.filter((file) => file.type === 'credential').length,
        credsEligibleWithConflicts: uniques.filter((file) => file.type === 'credential' && file.conflict).length,
        variablesEligible: uniques.filter((file) => file.type === 'variables').length,
    };
}
function getTrackingInformationFromPostPushResult(userId, result) {
    const uniques = filterSourceControlledFilesUniqueIds(result);
    return {
        userId,
        workflowsPushed: uniques.filter((file) => file.pushed && file.type === 'workflow').length ?? 0,
        workflowsEligible: uniques.filter((file) => file.type === 'workflow').length ?? 0,
        credsPushed: uniques.filter((file) => file.pushed && file.file.startsWith('credential_stubs')).length ?? 0,
        variablesPushed: uniques.filter((file) => file.pushed && file.file.startsWith('variable_stubs')).length ?? 0,
    };
}
function normalizeAndValidateSourceControlledFilePath(gitFolderPath, filePath) {
    (0, strict_1.ok)(path_1.default.isAbsolute(gitFolderPath), 'gitFolder must be an absolute path');
    const normalizedPath = path_1.default.isAbsolute(filePath)
        ? filePath
        : (0, backend_common_1.safeJoinPath)(gitFolderPath, filePath);
    if (!(0, backend_common_1.isContainedWithin)(gitFolderPath, filePath)) {
        throw new n8n_workflow_1.UserError(`File path ${filePath} is invalid`);
    }
    return normalizedPath;
}
function hasOwnerChanged(owner1, owner2) {
    if (!owner1 || !owner2) {
        const existingOwner = owner1 || owner2;
        if (!existingOwner)
            return false;
        if (typeof existingOwner === 'string')
            return false;
        return existingOwner.type === 'team';
    }
    if (typeof owner1 === 'string') {
        return false;
    }
    if (owner1.type !== 'team' && owner2.type !== 'team') {
        return false;
    }
    const owner1TeamId = 'teamId' in owner1 ? owner1.teamId : owner1.projectId;
    const owner2TeamId = 'teamId' in owner2 ? owner2.teamId : owner2.projectId;
    return owner1TeamId !== owner2TeamId;
}
function normalizeDescription(description) {
    return description ? description : null;
}
function isWorkflowModified(local, remote, direction) {
    const hasVersionIdChanged = remote.versionId !== local.versionId;
    const hasParentFolderIdChanged = remote.parentFolderId !== undefined && remote.parentFolderId !== local.parentFolderId;
    const hasDescriptionChanged = direction === 'pull' && remote.description === undefined
        ? false
        : normalizeDescription(remote.description) !== normalizeDescription(local.description);
    const ownerChanged = hasOwnerChanged(remote.owner, local.owner);
    return hasVersionIdChanged || hasParentFolderIdChanged || hasDescriptionChanged || ownerChanged;
}
function areDataTableColumnsEqual(localColumns, remoteColumns) {
    if (localColumns.length !== remoteColumns.length) {
        return false;
    }
    const sortedLocal = [...localColumns].sort((a, b) => a.id.localeCompare(b.id));
    const sortedRemote = [...remoteColumns].sort((a, b) => a.id.localeCompare(b.id));
    return sortedLocal.every((localCol, idx) => {
        const remoteCol = sortedRemote[idx];
        return (localCol.id === remoteCol.id &&
            localCol.name === remoteCol.name &&
            localCol.type === remoteCol.type &&
            localCol.index === remoteCol.index);
    });
}
function isDataTableModified(localDt, remoteDt) {
    if (localDt.name !== remoteDt.name) {
        return true;
    }
    const ownerChanged = hasOwnerChanged(remoteDt.ownedBy, localDt.ownedBy);
    if (ownerChanged) {
        return true;
    }
    return !areDataTableColumnsEqual(localDt.columns, remoteDt.columns);
}
function getDataTableColumnKey(column) {
    return `${column.name}:${column.type}`;
}
function isValidDataTableColumnType(type) {
    return ['string', 'number', 'boolean', 'date'].includes(type);
}
function areSameCredentials(credA, credB) {
    return (credA.name === credB.name &&
        credA.type === credB.type &&
        !hasOwnerChanged(credA.ownedBy, credB.ownedBy) &&
        Boolean(credA.isGlobal) === Boolean(credB.isGlobal) &&
        Boolean(credA.isResolvable) === Boolean(credB.isResolvable) &&
        Boolean(credA.resolvableAllowFallback) === Boolean(credB.resolvableAllowFallback) &&
        !hasSynchableCredentialDataChanged(credA.data, credB.data));
}
function hasSynchableCredentialDataChanged(data1, data2) {
    if (!data1 && !data2)
        return false;
    if (!data1 || !data2)
        return true;
    const sanitizedData1 = sanitizeCredentialData(data1);
    const sanitizedData2 = sanitizeCredentialData(data2);
    return !(0, isEqual_1.default)(sanitizedData1, sanitizedData2);
}
//# sourceMappingURL=source-control-helper.ee.js.map