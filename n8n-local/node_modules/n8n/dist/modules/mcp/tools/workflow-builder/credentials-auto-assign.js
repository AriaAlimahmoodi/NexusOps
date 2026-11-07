"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reconcileAiGatewayMarkers = reconcileAiGatewayMarkers;
exports.autoPopulateNodeCredentials = autoPopulateNodeCredentials;
exports.trackAutoassignOutcomes = trackAutoassignOutcomes;
exports.stripNullCredentialStubs = stripNullCredentialStubs;
const n8n_workflow_1 = require("n8n-workflow");
const ai_gateway_eligibility_1 = require("../../../../services/ai-gateway-eligibility");
const mcp_constants_1 = require("../../mcp.constants");
const AI_GATEWAY_CREDENTIAL_NAME = 'Gateway credits';
function setManagedCredential(node, nodeTypeDescription, credentialType, resolvedParameters) {
    node.credentials = node.credentials ?? {};
    node.credentials[credentialType] = {
        id: null,
        name: AI_GATEWAY_CREDENTIAL_NAME,
        __aiGatewayManaged: true,
    };
    const credentialDescription = nodeTypeDescription.credentials?.find((cred) => cred.name === credentialType);
    if (credentialDescription &&
        !n8n_workflow_1.NodeHelpers.displayParameter(resolvedParameters, credentialDescription, node, nodeTypeDescription)) {
        node.parameters = {
            ...node.parameters,
            ...(0, n8n_workflow_1.getCredentialActivationParameters)(credentialDescription.displayOptions),
        };
    }
}
function assignAiGatewayCredential(node, nodeTypeDescription, credentialType, resolvedParameters, assignments, outcomes) {
    setManagedCredential(node, nodeTypeDescription, credentialType, resolvedParameters);
    assignments.push({
        nodeName: node.name,
        credentialName: AI_GATEWAY_CREDENTIAL_NAME,
        credentialType,
        source: 'aiGateway',
    });
    outcomes.push({
        nodeName: node.name,
        credentialType,
        source: 'aiGateway',
        hadUserCredential: false,
        aiGatewayAvailable: true,
    });
}
function reconcileAiGatewayMarkers(nodes, nodeTypes, aiGatewayConfig) {
    for (const node of nodes) {
        if (!node.credentials)
            continue;
        const credentials = node.credentials;
        const markerTypes = Object.keys(credentials).filter((credentialType) => credentials[credentialType]?.__aiGatewayManaged);
        if (markerTypes.length === 0)
            continue;
        const nodeTypeDescription = aiGatewayConfig
            ? resolveNodeTypeDescription(node, nodeTypes)
            : undefined;
        const nodeParameters = nodeTypeDescription
            ? resolveNodeParameters(node, nodeTypeDescription)
            : undefined;
        if (!aiGatewayConfig || !nodeTypeDescription || !nodeParameters) {
            for (const credentialType of markerTypes)
                delete credentials[credentialType];
            continue;
        }
        for (const credentialType of markerTypes) {
            if ((0, ai_gateway_eligibility_1.checkAiGatewayEligibility)(node, credentialType, aiGatewayConfig, nodeParameters).eligible) {
                setManagedCredential(node, nodeTypeDescription, credentialType, nodeParameters);
            }
            else {
                delete credentials[credentialType];
            }
        }
    }
}
function resolveNodeTypeDescription(node, nodeTypes) {
    try {
        return nodeTypes.getByNameAndVersion(node.type, node.typeVersion).description;
    }
    catch {
        return undefined;
    }
}
function resolveNodeParameters(node, description) {
    return (n8n_workflow_1.NodeHelpers.getNodeParameters(description.properties, node.parameters, true, false, node, description) ?? node.parameters);
}
async function autoPopulateNodeCredentials(workflow, user, nodeTypes, credentialsService, projectId, aiGatewayService) {
    const usableCredentials = await credentialsService.getCredentialsAUserCanUseInAWorkflow(user, {
        projectId,
    });
    const credentialsByType = new Map();
    for (const cred of usableCredentials) {
        const list = credentialsByType.get(cred.type) ?? [];
        list.push({ id: cred.id, name: cred.name });
        credentialsByType.set(cred.type, list);
    }
    const availability = aiGatewayService
        ? await aiGatewayService.isAvailable()
        : { available: false };
    const aiGatewayConfig = availability.available
        ? availability.config
        : undefined;
    reconcileAiGatewayMarkers(workflow.nodes, nodeTypes, aiGatewayConfig);
    const assignments = [];
    const skippedHttpNodes = [];
    const outcomes = [];
    for (const node of workflow.nodes) {
        if (node.disabled)
            continue;
        if (ai_gateway_eligibility_1.HTTP_NODE_TYPES.has(node.type)) {
            skippedHttpNodes.push(node.name);
            continue;
        }
        let nodeTypeDescription;
        try {
            const nodeType = nodeTypes.getByNameAndVersion(node.type, node.typeVersion);
            nodeTypeDescription = nodeType.description;
        }
        catch {
            continue;
        }
        const credentialDescriptions = nodeTypeDescription.credentials;
        if (!credentialDescriptions?.length)
            continue;
        const nodeParametersWithDefaults = n8n_workflow_1.NodeHelpers.getNodeParameters(nodeTypeDescription.properties, node.parameters, true, false, node, nodeTypeDescription) ?? node.parameters;
        for (const credDesc of credentialDescriptions) {
            const shouldDisplay = n8n_workflow_1.NodeHelpers.displayParameter(nodeParametersWithDefaults, credDesc, node, nodeTypeDescription);
            if (!shouldDisplay)
                continue;
            const existing = node.credentials?.[credDesc.name];
            if (existing?.id)
                continue;
            if (existing?.__aiGatewayManaged)
                continue;
            const userCandidates = credentialsByType.get(credDesc.name);
            const hadUserCredential = !!userCandidates?.length;
            if (hadUserCredential) {
                node.credentials = node.credentials ?? {};
                node.credentials[credDesc.name] = {
                    id: userCandidates[0].id,
                    name: userCandidates[0].name,
                };
                assignments.push({
                    nodeName: node.name,
                    credentialName: userCandidates[0].name,
                    credentialType: credDesc.name,
                    source: 'user',
                });
                outcomes.push({
                    nodeName: node.name,
                    credentialType: credDesc.name,
                    source: 'user',
                    hadUserCredential: true,
                    aiGatewayAvailable: !!aiGatewayConfig,
                });
                continue;
            }
            if (aiGatewayConfig) {
                const eligibility = (0, ai_gateway_eligibility_1.checkAiGatewayEligibility)(node, credDesc.name, aiGatewayConfig, nodeParametersWithDefaults);
                if (eligibility.eligible) {
                    assignAiGatewayCredential(node, nodeTypeDescription, credDesc.name, nodeParametersWithDefaults, assignments, outcomes);
                    continue;
                }
                if (eligibility.reason === 'credentialTypeNotCovered') {
                    const activation = (0, n8n_workflow_1.resolveSupportedCredentialActivation)(nodeTypeDescription, { typeVersion: node.typeVersion, parameters: nodeParametersWithDefaults }, (credentialType) => credentialType !== credDesc.name &&
                        !node.credentials?.[credentialType]?.id &&
                        !credentialsByType.get(credentialType)?.length &&
                        (0, ai_gateway_eligibility_1.checkAiGatewayEligibility)(node, credentialType, aiGatewayConfig, nodeParametersWithDefaults).eligible);
                    if (activation) {
                        assignAiGatewayCredential(node, nodeTypeDescription, activation.credentialType, nodeParametersWithDefaults, assignments, outcomes);
                        continue;
                    }
                }
                outcomes.push({
                    nodeName: node.name,
                    credentialType: credDesc.name,
                    source: 'none',
                    hadUserCredential: false,
                    aiGatewayAvailable: true,
                    reasonNotAiGateway: eligibility.reason,
                });
                continue;
            }
            outcomes.push({
                nodeName: node.name,
                credentialType: credDesc.name,
                source: 'none',
                hadUserCredential: false,
                aiGatewayAvailable: false,
                reasonNotAiGateway: 'notAvailable',
            });
        }
    }
    return { assignments, skippedHttpNodes, outcomes };
}
function trackAutoassignOutcomes(telemetry, userId, toolName, outcomes, nodesByName, workflowId) {
    for (const outcome of outcomes) {
        const nodeType = nodesByName?.get(outcome.nodeName) ?? outcome.nodeName;
        const payload = {
            user_id: userId,
            tool_name: toolName,
            node_type: nodeType,
            credential_type: outcome.credentialType,
            source: outcome.source,
            had_user_credential: outcome.hadUserCredential,
            ai_gateway_available: outcome.aiGatewayAvailable,
            ...(outcome.reasonNotAiGateway ? { reason_not_ai_gateway: outcome.reasonNotAiGateway } : {}),
        };
        telemetry.track(mcp_constants_1.MCP_CREDENTIALS_AUTOASSIGN_EVENT, payload);
        if (outcome.source !== 'none') {
            telemetry.track('Node credential assigned', {
                credential_type: outcome.credentialType,
                node_type: nodeType,
                workflow_id: workflowId ?? '',
                credential_kind: outcome.source === 'aiGateway' ? 'n8n_connect' : 'own',
                source: 'mcp',
            });
        }
    }
}
function stripNullCredentialStubs(nodes) {
    for (const node of nodes) {
        if (node.credentials) {
            for (const key of Object.keys(node.credentials)) {
                if (node.credentials[key] == null) {
                    delete node.credentials[key];
                }
            }
            if (Object.keys(node.credentials).length === 0) {
                node.credentials = undefined;
            }
        }
    }
}
//# sourceMappingURL=credentials-auto-assign.js.map