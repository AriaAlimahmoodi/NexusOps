"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decideTagImportAction = decideTagImportAction;
const n8n_packages_types_1 = require("../../n8n-packages.types");
const TAG_NAME_MAX_LENGTH = 24;
const TAG_ID_MAX_LENGTH = 36;
const FORBIDDEN_CHARS = /[\p{Cc}\p{Cs}]/u;
function decideTagImportAction(requirement, targetTagWithSameId, nameHolder, missingMode, conflictPolicy) {
    const sourceId = requirement.id;
    const name = requirement.name.trim();
    if (targetTagWithSameId) {
        return decideForMatchedId(sourceId, name, targetTagWithSameId, nameHolder, conflictPolicy);
    }
    return decideForAbsentId(sourceId, name, nameHolder, missingMode, conflictPolicy);
}
function decideForMatchedId(sourceId, name, targetTag, nameHolder, conflictPolicy) {
    if (targetTag.name === name)
        return { action: 'attach', target: targetTag };
    if (conflictPolicy === n8n_packages_types_1.TagConflictPolicy.Skip) {
        return { action: 'drop', tag: { id: sourceId, name } };
    }
    if (conflictPolicy === n8n_packages_types_1.TagConflictPolicy.Rename && !nameHolder) {
        return (invalidName(name, sourceId) ?? {
            action: 'rename',
            rename: { id: sourceId, from: targetTag.name, to: name },
        });
    }
    return {
        action: 'fail',
        failure: {
            kind: 'rename-drift',
            sourceId,
            name,
            existingName: targetTag.name,
            ...(nameHolder ? { existingTagId: nameHolder.id } : {}),
        },
    };
}
function decideForAbsentId(sourceId, name, nameHolder, missingMode, conflictPolicy) {
    if (missingMode === n8n_packages_types_1.TagMissingMode.DoNothing) {
        return { action: 'drop', tag: { id: sourceId, name } };
    }
    if (nameHolder) {
        if (conflictPolicy === n8n_packages_types_1.TagConflictPolicy.Skip) {
            return { action: 'drop', tag: { id: sourceId, name } };
        }
        if (conflictPolicy === n8n_packages_types_1.TagConflictPolicy.Rename) {
            return (invalidId(sourceId, name) ?? {
                action: 'reconcile',
                reconcile: { id: sourceId, name, oldId: nameHolder.id },
            });
        }
        return {
            action: 'fail',
            failure: { kind: 'name-collision', sourceId, name, existingTagId: nameHolder.id },
        };
    }
    return (invalidName(name, sourceId) ??
        invalidId(sourceId, name) ?? { action: 'create', tag: { id: sourceId, name } });
}
function invalidName(name, sourceId) {
    if (FORBIDDEN_CHARS.test(name)) {
        return { action: 'fail', failure: { kind: 'invalid-name', sourceId, name } };
    }
    const length = [...name].length;
    if (length >= 1 && length <= TAG_NAME_MAX_LENGTH)
        return undefined;
    return { action: 'fail', failure: { kind: 'invalid-name', sourceId, name } };
}
function invalidId(sourceId, name) {
    if (sourceId.length <= TAG_ID_MAX_LENGTH && !FORBIDDEN_CHARS.test(sourceId)) {
        return undefined;
    }
    return { action: 'fail', failure: { kind: 'invalid-id', sourceId, name } };
}
//# sourceMappingURL=tag-import-decision.js.map