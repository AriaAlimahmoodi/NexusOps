"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.keyProjectOutcomes = keyProjectOutcomes;
exports.restrictedNodeTypeMatch = restrictedNodeTypeMatch;
const difference_1 = __importDefault(require("lodash/difference"));
const mapValues_1 = __importDefault(require("lodash/mapValues"));
const partition_1 = __importDefault(require("lodash/partition"));
const bindStringList = (isPostgres, values) => isPostgres ? values : JSON.stringify(values);
const inBoundStringList = (isPostgres, parameter) => isPostgres
    ? `= ANY(CAST(:${parameter} AS text[]))`
    : `IN (SELECT value FROM json_each(:${parameter}))`;
const projectNodeTypeKeys = (projectIds, nodeTypes) => projectIds.flatMap((projectId) => nodeTypes.map((nodeType) => `${projectId} ${nodeType}`));
function keyProjectOutcomes({ byProjects, nodeTypesInUse }) {
    const [allowlists, denylists] = (0, partition_1.default)(byProjects, ({ nodeTypes }) => nodeTypes.length * 2 > nodeTypesInUse.length);
    return {
        exceptProjectIds: byProjects.flatMap(({ projectIds }) => projectIds),
        deniedKeys: denylists.flatMap(({ projectIds, nodeTypes }) => projectNodeTypeKeys(projectIds, nodeTypes)),
        allowlistProjectIds: allowlists.flatMap(({ projectIds }) => projectIds),
        allowedKeys: allowlists.flatMap(({ projectIds, nodeTypes }) => projectNodeTypeKeys(projectIds, (0, difference_1.default)(nodeTypesInUse, nodeTypes))),
    };
}
function restrictedNodeTypeMatch(restricted, isPostgres) {
    const inList = (parameter) => inBoundStringList(isPostgres, parameter);
    const { exceptProjectIds, deniedKeys, allowlistProjectIds, allowedKeys } = keyProjectOutcomes(restricted);
    const projectNodeType = "(restrictedOwner.projectId || ' ' || restrictedDep.dependencyKey)";
    const deniedByDefault = `restrictedDep.dependencyKey ${inList('restrictedShared')} AND NOT (restrictedOwner.projectId ${inList('restrictedExceptProjectIds')})`;
    const deniedInOwnProject = `${projectNodeType} ${inList('restrictedDeniedKeys')}`;
    const notInOwnAllowlist = `restrictedOwner.projectId ${inList('restrictedAllowlistProjectIds')} AND NOT (${projectNodeType} ${inList('restrictedAllowedKeys')})`;
    return {
        condition: `((${deniedByDefault}) OR ${deniedInOwnProject} OR (${notInOwnAllowlist}))`,
        parameters: (0, mapValues_1.default)({
            restrictedShared: restricted.shared,
            restrictedExceptProjectIds: exceptProjectIds,
            restrictedDeniedKeys: deniedKeys,
            restrictedAllowlistProjectIds: allowlistProjectIds,
            restrictedAllowedKeys: allowedKeys,
        }, (values) => bindStringList(isPostgres, values)),
    };
}
//# sourceMappingURL=restricted-node-type-match.js.map