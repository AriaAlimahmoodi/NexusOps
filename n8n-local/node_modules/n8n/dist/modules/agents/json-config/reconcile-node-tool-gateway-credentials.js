"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reconcileNodeToolGatewayCredentials = reconcileNodeToolGatewayCredentials;
exports.listAiGatewayManagedCredentialTypes = listAiGatewayManagedCredentialTypes;
exports.assignCredentialToNodeTools = assignCredentialToNodeTools;
const node_catalog_1 = require("@n8n/ai-utilities/node-catalog");
const n8n_workflow_1 = require("n8n-workflow");
const ai_gateway_eligibility_1 = require("../../../services/ai-gateway-eligibility");
const N8N_CONNECT_CREDENTIAL_NAME = 'Gateway credits';
const AI_GATEWAY_MANAGED_CREDENTIAL_FLAG = '__aiGatewayManaged';
function aiGatewayManagedCredential() {
    return {
        id: null,
        name: N8N_CONNECT_CREDENTIAL_NAME,
        [AI_GATEWAY_MANAGED_CREDENTIAL_FLAG]: true,
    };
}
function isCredentialSlotFilled(ref) {
    return !!ref && (!!ref.id || AI_GATEWAY_MANAGED_CREDENTIAL_FLAG in ref);
}
function setAiGatewayManagedCredential(node, credentialType, activationParameters) {
    node.credentials = node.credentials ?? {};
    node.credentials[credentialType] = aiGatewayManagedCredential();
    if (activationParameters && Object.keys(activationParameters).length > 0) {
        node.nodeParameters = { ...(node.nodeParameters ?? {}), ...activationParameters };
    }
}
function resolveNodeParameters(node, description) {
    const rawParameters = (node.nodeParameters ?? {});
    return (n8n_workflow_1.NodeHelpers.getNodeParameters(description.properties, rawParameters, true, false, { typeVersion: node.nodeTypeVersion }, description) ?? rawParameters);
}
function isCredentialDisplayed(node, description, credentialType, resolvedParameters) {
    const credentialDefinition = description.credentials?.find((c) => c.name === credentialType);
    if (!credentialDefinition)
        return true;
    return n8n_workflow_1.NodeHelpers.displayParameter(resolvedParameters, credentialDefinition, { typeVersion: node.nodeTypeVersion }, description);
}
function reconcileAiGatewayManagedMarkers(node, description, isEligible) {
    if (!node.credentials)
        return false;
    let parametersChanged = false;
    for (const [slot, ref] of Object.entries(node.credentials)) {
        if (!(AI_GATEWAY_MANAGED_CREDENTIAL_FLAG in ref))
            continue;
        if (!isEligible(slot)) {
            delete node.credentials[slot];
            continue;
        }
        const activation = (0, n8n_workflow_1.resolveSupportedCredentialActivation)(description, { typeVersion: node.nodeTypeVersion, parameters: resolveNodeParameters(node, description) }, (candidateType) => candidateType === slot);
        setAiGatewayManagedCredential(node, slot, activation?.parameters);
        if (activation && Object.keys(activation.parameters).length > 0)
            parametersChanged = true;
    }
    return parametersChanged;
}
function reconcileNodeToolGatewayCredentials(tools, nodeTypes, aiGatewayConfig, ownedCredentialTypes) {
    for (const tool of tools ?? []) {
        if (tool.type === 'node') {
            reconcileNode(tool.node, nodeTypes, aiGatewayConfig, ownedCredentialTypes);
        }
    }
}
function listAiGatewayManagedCredentialTypes(tools, nodeTypes) {
    const managed = new Set();
    const unsatisfied = new Set();
    for (const tool of tools ?? []) {
        if (tool.type !== 'node')
            continue;
        const node = tool.node;
        let description;
        try {
            description = nodeTypes.getByNameAndVersion(node.nodeType, node.nodeTypeVersion).description;
        }
        catch {
            continue;
        }
        for (const [credentialType, ref] of Object.entries(node.credentials ?? {})) {
            if (AI_GATEWAY_MANAGED_CREDENTIAL_FLAG in ref)
                managed.add(credentialType);
        }
        const resolvedParameters = resolveNodeParameters(node, description);
        for (const slot of (0, node_catalog_1.getRequiredNodeCredentialSlots)(description)) {
            const credentialType = slot.credentialType;
            if (isCredentialSlotFilled(node.credentials?.[credentialType]))
                continue;
            if (isCredentialDisplayed(node, description, credentialType, resolvedParameters)) {
                unsatisfied.add(credentialType);
            }
        }
    }
    return [...managed].filter((credentialType) => !unsatisfied.has(credentialType));
}
function assignCredentialToNodeTools(tools, nodeTypes, credentialType, credential) {
    let assigned = 0;
    for (const tool of tools ?? []) {
        if (tool.type !== 'node')
            continue;
        const node = tool.node;
        let description;
        try {
            description = nodeTypes.getByNameAndVersion(node.nodeType, node.nodeTypeVersion).description;
        }
        catch {
            continue;
        }
        if (!description.credentials?.some((c) => c.name === credentialType))
            continue;
        if (isCredentialSlotFilled(node.credentials?.[credentialType]))
            continue;
        const resolvedParameters = resolveNodeParameters(node, description);
        if (!isCredentialDisplayed(node, description, credentialType, resolvedParameters))
            continue;
        node.credentials = { ...(node.credentials ?? {}), [credentialType]: { ...credential } };
        assigned++;
    }
    return assigned;
}
function reconcileNode(node, nodeTypes, aiGatewayConfig, ownedCredentialTypes) {
    let description;
    try {
        description = nodeTypes.getByNameAndVersion(node.nodeType, node.nodeTypeVersion).description;
    }
    catch {
        dropAiGatewayMarkers(node);
        return;
    }
    let resolvedParameters = resolveNodeParameters(node, description);
    const eligibility = (credentialType) => aiGatewayConfig === undefined
        ? { eligible: false, reason: 'nodeNotCovered' }
        : (0, ai_gateway_eligibility_1.checkAiGatewayEligibility)({
            type: node.nodeType,
            typeVersion: node.nodeTypeVersion,
            parameters: (node.nodeParameters ?? {}),
        }, credentialType, aiGatewayConfig, resolvedParameters);
    const isEligible = (credentialType) => eligibility(credentialType).eligible;
    const assignSupportedSiblingCredential = (credentialType) => {
        if (aiGatewayConfig === undefined)
            return;
        const activation = (0, n8n_workflow_1.resolveSupportedCredentialActivation)(description, { typeVersion: node.nodeTypeVersion, parameters: resolvedParameters }, (candidateType) => candidateType !== credentialType &&
            !node.credentials?.[candidateType]?.id &&
            !ownedCredentialTypes.has(candidateType) &&
            isEligible(candidateType));
        if (!activation)
            return;
        setAiGatewayManagedCredential(node, activation.credentialType, activation.parameters);
        resolvedParameters = resolveNodeParameters(node, description);
    };
    if (reconcileAiGatewayManagedMarkers(node, description, isEligible)) {
        resolvedParameters = resolveNodeParameters(node, description);
    }
    if (aiGatewayConfig === undefined)
        return;
    if (ai_gateway_eligibility_1.HTTP_NODE_TYPES.has(node.nodeType))
        return;
    for (const slot of (0, node_catalog_1.getRequiredNodeCredentialSlots)(description)) {
        const credentialType = slot.credentialType;
        if (isCredentialSlotFilled(node.credentials?.[credentialType]))
            continue;
        if (ownedCredentialTypes.has(credentialType))
            continue;
        if (!isCredentialDisplayed(node, description, credentialType, resolvedParameters))
            continue;
        const slotEligibility = eligibility(credentialType);
        if (slotEligibility.eligible) {
            setAiGatewayManagedCredential(node, credentialType);
            continue;
        }
        assignSupportedSiblingCredential(credentialType);
    }
}
function dropAiGatewayMarkers(node) {
    if (!node.credentials)
        return;
    for (const [slot, ref] of Object.entries(node.credentials)) {
        if (AI_GATEWAY_MANAGED_CREDENTIAL_FLAG in ref)
            delete node.credentials[slot];
    }
}
//# sourceMappingURL=reconcile-node-tool-gateway-credentials.js.map