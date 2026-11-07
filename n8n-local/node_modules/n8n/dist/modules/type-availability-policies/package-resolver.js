"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.packageResolverFor = packageResolverFor;
exports.policedTypeFor = policedTypeFor;
exports.isCredentialTypeKnown = isCredentialTypeKnown;
exports.isPackageInstalled = isPackageInstalled;
exports.loadedCheckFor = loadedCheckFor;
const constants_1 = require("./constants");
const policy_evaluator_1 = require("./policy-evaluator");
function credentialTypePackageResolver(loadNodesAndCredentials) {
    return (typeName) => {
        let packageName = null;
        for (const loader of Object.values(loadNodesAndCredentials.loaders)) {
            if (Object.hasOwn(loader.known.credentials, typeName)) {
                packageName = loader.packageName;
            }
        }
        return packageName;
    };
}
function packageResolverFor(kind, loadNodesAndCredentials) {
    return kind === constants_1.CREDENTIAL_TYPES_KIND
        ? credentialTypePackageResolver(loadNodesAndCredentials)
        : policy_evaluator_1.nodeTypePackageResolver;
}
function credentialTypeAncestors(loadNodesAndCredentials, typeName) {
    const { knownCredentials } = loadNodesAndCredentials;
    const parentsOf = (name) => Object.hasOwn(knownCredentials, name) ? (knownCredentials[name].extends ?? []) : [];
    const seen = new Set([typeName]);
    const queue = [...parentsOf(typeName)];
    for (let index = 0; index < queue.length; index++) {
        const parent = queue[index];
        if (seen.has(parent))
            continue;
        seen.add(parent);
        queue.push(...parentsOf(parent));
    }
    seen.delete(typeName);
    return [...seen];
}
function policedTypeFor(kind, nodeTypes, loadNodesAndCredentials) {
    if (kind === constants_1.NODE_TYPES_KIND) {
        return (name) => ({ name, baseName: nodeTypes.resolveBaseName(name).baseName });
    }
    return (name) => ({
        name,
        baseName: name,
        ancestors: credentialTypeAncestors(loadNodesAndCredentials, name),
    });
}
function isCredentialTypeKnown(loadNodesAndCredentials, typeName) {
    return Object.hasOwn(loadNodesAndCredentials.knownCredentials, typeName);
}
function isPackageInstalled(loadNodesAndCredentials, packageName) {
    return Object.hasOwn(loadNodesAndCredentials.loaders, packageName);
}
function loadedCheckFor(kind, nodeTypes, loadNodesAndCredentials) {
    const policedType = policedTypeFor(kind, nodeTypes, loadNodesAndCredentials);
    const isNameKnown = kind === constants_1.NODE_TYPES_KIND
        ? (name) => Object.hasOwn(loadNodesAndCredentials.knownNodes, name)
        : (name) => isCredentialTypeKnown(loadNodesAndCredentials, name);
    return (selector) => {
        switch (selector.kind) {
            case 'package':
                return isPackageInstalled(loadNodesAndCredentials, selector.value);
            case 'extends':
                return isCredentialTypeKnown(loadNodesAndCredentials, selector.value);
            case 'name':
                return isNameKnown(policedType(selector.value).baseName);
        }
    };
}
//# sourceMappingURL=package-resolver.js.map