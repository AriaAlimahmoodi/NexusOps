"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeRequirements = void 0;
const mergeRequirements = (...parts) => ({
    credentials: parts.flatMap((part) => part?.credentials ?? []),
    dataTables: parts.flatMap((part) => part?.dataTables ?? []),
    variables: parts.flatMap((part) => part?.variables ?? []),
    tags: parts.flatMap((part) => part?.tags ?? []),
    nodeTypes: parts.flatMap((part) => part?.nodeTypes ?? []),
});
exports.mergeRequirements = mergeRequirements;
//# sourceMappingURL=requirements.types.js.map