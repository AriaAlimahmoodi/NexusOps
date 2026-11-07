"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagConflictPolicy = exports.TagMissingMode = exports.VariableParentPolicy = exports.CredentialConflictPolicy = exports.VariableConflictPolicy = exports.VariableMissingMode = exports.DataTableSchemaConflictPolicy = exports.DataTableMissingMode = exports.DataTableMatchingMode = exports.CredentialExportPolicy = exports.ExportVersionPolicy = exports.ExportDependencyPolicy = exports.MissingNodeTypeMode = exports.OverwriteDeletionPolicy = exports.FolderConflictPolicy = exports.ProjectConflictPolicy = exports.WorkflowIdPolicy = exports.WorkflowConflictPolicy = exports.WorkflowPublishingPolicy = void 0;
exports.createBindings = createBindings;
exports.mergeBindings = mergeBindings;
exports.serializeBindings = serializeBindings;
var workflow_publishing_policy_types_1 = require("./entities/workflow/workflow-publishing-policy.types");
Object.defineProperty(exports, "WorkflowPublishingPolicy", { enumerable: true, get: function () { return workflow_publishing_policy_types_1.WorkflowPublishingPolicy; } });
exports.WorkflowConflictPolicy = {
    NewVersion: 'new-version',
    Fail: 'fail',
    Skip: 'skip',
};
exports.WorkflowIdPolicy = {
    New: 'new',
    Source: 'source',
};
exports.ProjectConflictPolicy = {
    Merge: 'merge',
    Fail: 'fail',
    Overwrite: 'overwrite',
};
exports.FolderConflictPolicy = {
    Merge: 'merge',
    Fail: 'fail',
    Overwrite: 'overwrite',
};
exports.OverwriteDeletionPolicy = {
    Archive: 'archive',
    HardDelete: 'hard-delete',
};
exports.MissingNodeTypeMode = {
    Fail: 'fail',
    ImportAnyway: 'import-anyway',
};
exports.ExportDependencyPolicy = {
    Fail: 'fail',
    ReferenceOnly: 'reference-only',
    IncludeInPackage: 'include-in-package',
};
exports.ExportVersionPolicy = {
    PublishedStrict: 'published-strict',
    PreferPublished: 'prefer-published',
    IgnoreUnpublished: 'ignore-unpublished',
    Latest: 'latest',
};
exports.CredentialExportPolicy = {
    ExpressionValuesOnly: 'expression-values-only',
    NoValues: 'no-values',
};
exports.DataTableMatchingMode = {
    ById: 'by-id',
};
exports.DataTableMissingMode = {
    Create: 'create',
    MustPreexist: 'must-preexist',
    DoNothing: 'do-nothing',
};
exports.DataTableSchemaConflictPolicy = {
    KeepExisting: 'keep-existing',
    Fail: 'fail',
    Overwrite: 'overwrite',
    OverwriteNonDestructive: 'overwrite-non-destructive',
};
exports.VariableMissingMode = {
    DoNothing: 'do-nothing',
    MustPreexist: 'must-preexist',
    CreateStub: 'create-stub',
    CreateWithValue: 'create-with-value',
};
exports.VariableConflictPolicy = {
    KeepExisting: 'keep-existing',
    Overwrite: 'overwrite',
    Fail: 'fail',
};
exports.CredentialConflictPolicy = {
    KeepExisting: 'keep-existing',
    Overwrite: 'overwrite',
    Fail: 'fail',
};
exports.VariableParentPolicy = {
    Project: 'project',
    Global: 'global',
};
exports.TagMissingMode = {
    Create: 'create',
    DoNothing: 'do-nothing',
};
exports.TagConflictPolicy = {
    Skip: 'skip',
    Fail: 'fail',
    Rename: 'rename',
};
function createBindings(seed = {}) {
    return {
        workflows: new Map(),
        credentials: new Map(),
        ...seed,
    };
}
function mergeBindings(...bindings) {
    return {
        workflows: new Map(bindings.flatMap(({ workflows }) => [...workflows])),
        credentials: new Map(bindings.flatMap(({ credentials }) => [...credentials])),
    };
}
function serializeBindings(bindings) {
    return {
        workflows: Object.fromEntries(bindings.workflows),
        credentials: Object.fromEntries(bindings.credentials),
    };
}
//# sourceMappingURL=n8n-packages.types.js.map