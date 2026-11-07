"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCredentialReferences = validateCredentialReferences;
exports.validateWorkflowCredentialReferences = validateWorkflowCredentialReferences;
const n8n_workflow_1 = require("n8n-workflow");
const errors_1 = require("@n8n/errors");
function declaresCredentialSelect(description, propertyName) {
    return (description.properties?.some((p) => p.name === propertyName && p.type === 'credentialsSelect') ?? false);
}
function nodeAcceptsCredentialKey(description, parameters, credentialKey) {
    if (description.credentials?.some((c) => c.name === credentialKey)) {
        return true;
    }
    const nodeCredentialType = parameters?.nodeCredentialType;
    if (typeof nodeCredentialType === 'string' &&
        nodeCredentialType === credentialKey &&
        declaresCredentialSelect(description, 'nodeCredentialType')) {
        return true;
    }
    const genericAuthType = parameters?.genericAuthType;
    if (typeof genericAuthType === 'string' &&
        genericAuthType === credentialKey &&
        declaresCredentialSelect(description, 'genericAuthType')) {
        return true;
    }
    return false;
}
const fail = (opIndex, message) => ({
    ok: false,
    opIndex,
    error: `Operation ${opIndex} failed: ${message}`,
});
async function buildProjectCredentialClassifier(user, scope, credentialsService) {
    const usable = await credentialsService.getCredentialsAUserCanUseInAWorkflow(user, scope);
    const usableTypeById = new Map();
    for (const credential of usable) {
        usableTypeById.set(credential.id, credential.type);
    }
    const fallbackCache = new Map();
    return async (credentialId) => {
        const usableType = usableTypeById.get(credentialId);
        if (usableType !== undefined) {
            return { status: 'usable', type: usableType };
        }
        const cached = fallbackCache.get(credentialId);
        if (cached)
            return cached;
        let classification;
        try {
            const credential = await credentialsService.getOne(user, credentialId, false);
            classification = { status: 'cross-project', type: credential.type };
        }
        catch (error) {
            if (error instanceof errors_1.NotFoundError) {
                classification = { status: 'not-found' };
            }
            else {
                throw error;
            }
        }
        fallbackCache.set(credentialId, classification);
        return classification;
    };
}
function createLazyClassifier(user, scope, credentialsService) {
    let classifierPromise;
    return async () => {
        classifierPromise ??= buildProjectCredentialClassifier(user, scope, credentialsService);
        return await classifierPromise;
    };
}
function describeCredentialProblem(classification, credentialId, credentialKey) {
    if (classification.status === 'not-found') {
        return `credential '${credentialId}' not found or not accessible`;
    }
    if (classification.status === 'cross-project') {
        return `credential '${credentialId}' is not usable in this workflow's project. Omit it so a credential from the project is auto-assigned, share the credential with the project, or use a credential that belongs to the project`;
    }
    if (classification.type !== credentialKey) {
        return `credential '${credentialId}' is type '${classification.type}' but '${credentialKey}' is expected`;
    }
    return null;
}
function computeActiveCredentialTypes(node, nodeTypes) {
    let description = null;
    try {
        description = nodeTypes.getByNameAndVersion(node.type, node.typeVersion).description;
    }
    catch {
    }
    return n8n_workflow_1.NodeHelpers.getActiveCredentialTypes(node, description);
}
async function validateCredentialReferences(operations, existingWorkflow, user, credentialsService, nodeTypes, scope) {
    const nameToNodeMeta = new Map();
    for (const node of existingWorkflow.nodes) {
        nameToNodeMeta.set(node.name, {
            type: node.type,
            typeVersion: node.typeVersion,
            parameters: node.parameters,
        });
    }
    const getClassifier = createLazyClassifier(user, scope, credentialsService);
    const checkCredentialReference = async (opIndex, nodeMeta, credentialKey, credentialId) => {
        let description;
        try {
            description = nodeTypes.getByNameAndVersion(nodeMeta.type, nodeMeta.typeVersion).description;
        }
        catch {
            return null;
        }
        if (!nodeAcceptsCredentialKey(description, nodeMeta.parameters, credentialKey)) {
            return fail(opIndex, `node type '${nodeMeta.type}' does not accept credential '${credentialKey}'`);
        }
        const classify = await getClassifier();
        const classification = await classify(credentialId);
        const problem = describeCredentialProblem(classification, credentialId, credentialKey);
        if (problem)
            return fail(opIndex, problem);
        return null;
    };
    for (let i = 0; i < operations.length; i++) {
        const op = operations[i];
        if (op.type === 'addNode') {
            const nodeMeta = {
                type: op.node.type,
                typeVersion: op.node.typeVersion,
                parameters: op.node.parameters,
            };
            if (op.node.credentials) {
                for (const [key, value] of Object.entries(op.node.credentials)) {
                    if (!value.id)
                        continue;
                    const failure = await checkCredentialReference(i, nodeMeta, key, value.id);
                    if (failure)
                        return failure;
                }
            }
            nameToNodeMeta.set(op.node.name, nodeMeta);
        }
        else if (op.type === 'renameNode') {
            const meta = nameToNodeMeta.get(op.oldName);
            if (meta) {
                nameToNodeMeta.delete(op.oldName);
                nameToNodeMeta.set(op.newName, meta);
            }
        }
        else if (op.type === 'removeNode') {
            nameToNodeMeta.delete(op.nodeName);
        }
        else if (op.type === 'updateNodeParameters') {
            const meta = nameToNodeMeta.get(op.nodeName);
            if (meta) {
                meta.parameters = op.replace
                    ? { ...op.parameters }
                    : { ...(meta.parameters ?? {}), ...op.parameters };
            }
        }
        else if (op.type === 'setNodeParameter') {
            const meta = nameToNodeMeta.get(op.nodeName);
            if (meta && (op.path === '/nodeCredentialType' || op.path === '/genericAuthType')) {
                meta.parameters = { ...(meta.parameters ?? {}), [op.path.slice(1)]: op.value };
            }
        }
        else if (op.type === 'setNodeCredential') {
            const meta = nameToNodeMeta.get(op.nodeName);
            if (!meta)
                continue;
            const failure = await checkCredentialReference(i, meta, op.credentialKey, op.credentialId);
            if (failure)
                return failure;
        }
    }
    return { ok: true };
}
async function validateWorkflowCredentialReferences(nodes, user, credentialsService, nodeTypes, projectId) {
    const getClassifier = createLazyClassifier(user, { projectId }, credentialsService);
    for (const node of nodes) {
        if (node.disabled || !node.credentials)
            continue;
        const activeTypes = computeActiveCredentialTypes(node, nodeTypes);
        for (const [credentialKey, ref] of Object.entries(node.credentials)) {
            const credentialId = ref?.id;
            if (!credentialId)
                continue;
            if (activeTypes !== null && !activeTypes.has(credentialKey))
                continue;
            const classify = await getClassifier();
            const classification = await classify(credentialId);
            const problem = describeCredentialProblem(classification, credentialId, credentialKey);
            if (problem) {
                return { ok: false, error: `Node "${node.name}": ${problem}` };
            }
        }
    }
    return { ok: true };
}
//# sourceMappingURL=credential-validation.js.map