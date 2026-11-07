"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CredentialMatcher = void 0;
const credential_types_1 = require("./credential.types");
class CredentialMatcher {
    constructor(credentialTypes, credentialsService) {
        this.credentialTypes = credentialTypes;
        this.credentialsService = credentialsService;
    }
    async match(requirements, context) {
        const orphanFailures = orphanBindingFailures(context.credentialBindings, requirements);
        const { known, unknownTypeFailures } = partitionByKnownType(requirements, this.credentialTypes);
        const { bound, unbound } = partitionByExplicitBinding(known, context.credentialBindings);
        const usableCredentials = known.length === 0
            ? []
            : await this.credentialsService.getCredentialsAUserCanUseInAWorkflow(context.user, {
                projectId: context.projectId,
            });
        const usableTypesById = new Map(usableCredentials.map((c) => [c.id, c.type]));
        const boundLocated = resolveExplicitBindings(bound, usableTypesById);
        const resolvedLocated = this.resolve(unbound, usableCredentials, context);
        const located = new Map([...boundLocated, ...resolvedLocated]);
        const successes = new Map();
        const notFoundFailures = [];
        const typeMismatchFailures = [];
        for (const reference of known) {
            const match = located.get(reference.id);
            if (match === undefined) {
                notFoundFailures.push(createNotFoundFailure(reference, context.credentialBindings?.get(reference.id)));
            }
            else if (match.targetType !== reference.type) {
                typeMismatchFailures.push(createTypeMismatchFailure(reference, match));
            }
            else {
                successes.set(reference.id, match.targetId);
            }
        }
        return {
            successes,
            failures: [
                ...orphanFailures,
                ...unknownTypeFailures,
                ...notFoundFailures,
                ...typeMismatchFailures,
            ],
        };
    }
}
exports.CredentialMatcher = CredentialMatcher;
function partitionByExplicitBinding(known, bindings) {
    const bound = [];
    const unbound = [];
    for (const reference of known) {
        const targetId = bindings?.get(reference.id);
        if (targetId === undefined) {
            unbound.push(reference);
        }
        else {
            bound.push({ reference, targetId });
        }
    }
    return { bound, unbound };
}
function resolveExplicitBindings(bound, usableTypesById) {
    return new Map(bound.flatMap(({ reference, targetId }) => {
        const targetType = usableTypesById.get(targetId);
        if (targetType === undefined)
            return [];
        return [[reference.id, { targetId, targetType }]];
    }));
}
function partitionByKnownType(requirements, credentialTypes) {
    const known = [];
    const unknownTypeFailures = [];
    for (const reference of requirements ?? []) {
        if (reference.type !== undefined && credentialTypes.recognizes(reference.type)) {
            known.push(reference);
        }
        else {
            unknownTypeFailures.push((0, credential_types_1.createFailure)(reference, 'unknown_type'));
        }
    }
    return { known, unknownTypeFailures };
}
function createNotFoundFailure(reference, requestedTargetId) {
    const failure = (0, credential_types_1.createFailure)(reference, 'not_found');
    return requestedTargetId === undefined ? failure : { ...failure, targetId: requestedTargetId };
}
function createTypeMismatchFailure(reference, match) {
    return {
        ...(0, credential_types_1.createFailure)(reference, 'type_mismatch'),
        targetId: match.targetId,
        expectedType: reference.type,
        actualType: match.targetType,
    };
}
function orphanBindingFailures(bindings, requirements) {
    if (!bindings || bindings.size === 0)
        return [];
    const requirementIds = new Set((requirements ?? []).map((requirement) => requirement.id));
    const failures = [];
    for (const [sourceId, targetId] of bindings) {
        if (!requirementIds.has(sourceId)) {
            failures.push({
                kind: 'source_not_found',
                sourceId,
                targetId,
            });
        }
    }
    return failures;
}
//# sourceMappingURL=credential-matcher.js.map