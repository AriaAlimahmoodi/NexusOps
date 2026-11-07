"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EphemeralNodeExecutor = exports.AGENT_PROVIDER_NODE_WHITELIST = exports.AGENT_TOOL_NODE_DENYLIST = void 0;
exports.isAgentProviderNode = isAgentProviderNode;
exports.isUsableAsAgentTool = isUsableAsAgentTool;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const get_error_message_1 = require("@n8n/utils/errors/get-error-message");
const tools_1 = require("@langchain/core/tools");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const uuid_1 = require("uuid");
const node_types_1 = require("../node-types");
const policy_enforcement_service_1 = require("../policy/policy-enforcement.service");
const policy_violation_error_1 = require("../policy/policy-violation.error");
const utils_1 = require("../utils");
const workflow_execute_additional_data_1 = require("../workflow-execute-additional-data");
const node_tool_operation_support_1 = require("./node-tool-operation-support");
function errorResult(error) {
    const violations = (0, policy_violation_error_1.findPolicyViolations)(error);
    return {
        status: 'error',
        data: [],
        error: (0, get_error_message_1.getErrorMessage)(error),
        ...(violations && { violations }),
    };
}
exports.AGENT_TOOL_NODE_DENYLIST = new Set([
    'n8n-nodes-base.executeCommand',
    'n8n-nodes-base.ssh',
    'n8n-nodes-base.readWriteFile',
]);
function stripAgentToolSuffix(nodeType) {
    return nodeType.endsWith('Tool') ? nodeType.slice(0, -'Tool'.length) : nodeType;
}
exports.AGENT_PROVIDER_NODE_WHITELIST = new Set([...n8n_workflow_1.AI_VENDOR_NODE_TYPES]);
function isAgentProviderNode(nodeType) {
    return exports.AGENT_PROVIDER_NODE_WHITELIST.has(nodeType);
}
function isUsableAsAgentTool(description) {
    if (description.usableAsTool)
        return true;
    const outputs = description.outputs;
    if (!Array.isArray(outputs))
        return false;
    return outputs.some((o) => {
        if (typeof o === 'string')
            return o === n8n_workflow_1.NodeConnectionTypes.AiTool;
        if (o && typeof o === 'object' && 'type' in o) {
            return o.type === n8n_workflow_1.NodeConnectionTypes.AiTool;
        }
        return false;
    });
}
let EphemeralNodeExecutor = class EphemeralNodeExecutor {
    constructor(nodeTypes, credentialsRepository, sharedCredentialsRepository, logger, policyEnforcementService) {
        this.nodeTypes = nodeTypes;
        this.credentialsRepository = credentialsRepository;
        this.sharedCredentialsRepository = sharedCredentialsRepository;
        this.logger = logger;
        this.policyEnforcementService = policyEnforcementService;
    }
    async resolveInlineCredentials(projectId, credentials) {
        if (!credentials || Object.keys(credentials).length === 0) {
            return null;
        }
        const accessible = await this.credentialsRepository.findAllCredentialsForProject(projectId);
        const resolved = {};
        for (const [credType, credName] of Object.entries(credentials)) {
            const matches = accessible.filter((c) => c.type === credType && c.name.toLowerCase() === credName.toLowerCase());
            if (matches.length === 0) {
                throw new n8n_workflow_1.UserError(`No accessible credential found for type "${credType}" with name "${credName}"`, { extra: { credType, credName } });
            }
            if (matches.length > 1) {
                throw new n8n_workflow_1.UserError(`Multiple credentials match type "${credType}" with name "${credName}". Use a unique credential name.`, { extra: { credType, credName } });
            }
            const entity = matches[0];
            resolved[credType] = { id: entity.id, name: entity.name };
        }
        return resolved;
    }
    async verifyCredentialDetailsForProject(projectId, details) {
        const verified = {};
        for (const [credType, d] of Object.entries(details)) {
            if (d.__aiGatewayManaged) {
                verified[credType] = { id: null, name: d.name, __aiGatewayManaged: true };
                continue;
            }
            if (!d.id) {
                throw new n8n_workflow_1.UserError(`Credential reference for "${credType}" is missing an id (required for execution).`, { extra: { credType, name: d.name } });
            }
            const sharedCredential = await this.sharedCredentialsRepository.findOne({
                where: { credentialsId: d.id, projectId },
                relations: { credentials: true },
            });
            if (!sharedCredential) {
                throw new n8n_workflow_1.UserError(`Credential "${d.name}" is not accessible or does not exist.`, {
                    extra: { credType, credentialId: d.id },
                });
            }
            if (sharedCredential.credentials.type !== credType) {
                throw new n8n_workflow_1.UserError(`Credential "${sharedCredential.credentials.name}" has type "${sharedCredential.credentials.type}" but the node expects credential slot "${credType}".`, {
                    extra: {
                        credType,
                        actualType: sharedCredential.credentials.type,
                        credentialId: d.id,
                    },
                });
            }
            verified[credType] = {
                id: sharedCredential.credentials.id,
                name: sharedCredential.credentials.name,
            };
        }
        return verified;
    }
    validateNodeForExecution(nodeType, typeVersion, nodeParameters) {
        if (exports.AGENT_TOOL_NODE_DENYLIST.has(stripAgentToolSuffix(nodeType))) {
            throw new n8n_workflow_1.UserError('Node type is not permitted for agent tool execution', {
                extra: { nodeType },
            });
        }
        const resolved = this.nodeTypes.getByNameAndVersion(nodeType, typeVersion);
        if (!isUsableAsAgentTool(resolved.description) && !isAgentProviderNode(nodeType)) {
            throw new n8n_workflow_1.UserError('Node is not usable as a tool', { extra: { nodeType } });
        }
        if (resolved.description.group.includes('trigger')) {
            throw new n8n_workflow_1.UserError('Trigger nodes cannot be executed standalone', { extra: { nodeType } });
        }
        const operation = nodeParameters.operation;
        if ((0, node_tool_operation_support_1.isUnsupportedEphemeralNodeOperation)(operation)) {
            throw new n8n_workflow_1.UserError((0, node_tool_operation_support_1.unsupportedEphemeralNodeOperationMessage)(operation), {
                extra: { nodeType, operation },
            });
        }
    }
    async enforceRunPolicy(node, projectId) {
        await this.policyEnforcementService.enforceWorkflowStart({ workflow: { id: null, name: node.name, nodes: [node], artifactKind: 'agent' }, projectId }, { kind: 'system', reason: 'execution' });
    }
    async buildEphemeralContextParts(tool, inputItems) {
        const node = {
            id: (0, uuid_1.v4)(),
            name: tool.nodeName ?? 'Target Node',
            type: tool.nodeType,
            typeVersion: tool.nodeTypeVersion,
            position: [0, 0],
            parameters: tool.nodeParameters,
            credentials: tool.credentials ?? undefined,
        };
        const workflow = new n8n_workflow_1.Workflow({
            nodes: [node],
            connections: {},
            active: false,
            nodeTypes: this.nodeTypes,
        });
        const additionalData = await (0, workflow_execute_additional_data_1.getBase)({ projectId: tool.projectId });
        if (tool.nodeType === n8n_workflow_1.DATA_TABLE_TOOL_NODE_TYPE) {
            additionalData.dataTableProjectId = tool.projectId;
        }
        tool.configureAdditionalData?.(additionalData);
        const runExecutionData = (0, n8n_workflow_1.createEmptyRunExecutionData)();
        const inputData = { main: [inputItems] };
        const executeData = { node, data: inputData, source: null };
        const mode = 'internal';
        return {
            node,
            workflow,
            additionalData,
            runExecutionData,
            inputData,
            executeData,
            mode,
        };
    }
    async executeNodeDirectly(tool, inputItems) {
        let output;
        try {
            const parts = await this.buildEphemeralContextParts(tool, inputItems);
            await this.enforceRunPolicy(parts.node, tool.projectId);
            const context = new n8n_core_1.ExecuteContext(parts.workflow, parts.node, parts.additionalData, parts.mode, parts.runExecutionData, 0, inputItems, parts.inputData, parts.executeData, []);
            const nodeType = this.nodeTypes.getByNameAndVersion(tool.nodeType, tool.nodeTypeVersion);
            const executionResult = await (0, utils_1.withExpressionIsolate)(parts.workflow, async () => {
                if (!nodeType.execute) {
                    return {
                        status: 'error',
                        data: [],
                        error: 'Node type does not have an execute method',
                    };
                }
                output =
                    nodeType instanceof n8n_workflow_1.Node
                        ? await nodeType.execute(context)
                        : await nodeType.execute.call(context);
                if (!Array.isArray(output) || !output[0]) {
                    return { status: 'error', data: [], error: 'No output data' };
                }
                return { status: 'success', data: output[0] };
            });
            return executionResult;
        }
        catch (error) {
            const result = errorResult(error);
            this.logger.debug('Node execution failed', { nodeType: tool.nodeType, error: result.error });
            return result;
        }
    }
    async evaluateExpressions(tool, expressions, inputItems) {
        const parts = await this.buildEphemeralContextParts(tool, inputItems);
        const context = new n8n_core_1.ExecuteContext(parts.workflow, parts.node, parts.additionalData, parts.mode, parts.runExecutionData, 0, inputItems, parts.inputData, parts.executeData, []);
        return await (0, utils_1.withExpressionIsolate)(parts.workflow, async () => {
            const resolved = {};
            for (const [name, expression] of Object.entries(expressions)) {
                try {
                    resolved[name] = context.evaluateExpression(expression.slice(1));
                }
                catch (error) {
                    throw new n8n_workflow_1.UserError(`Cannot resolve input "${name}": ${(0, get_error_message_1.getErrorMessage)(error)}`, {
                        cause: error,
                    });
                }
            }
            return resolved;
        });
    }
    async executeInline(request) {
        try {
            this.validateNodeForExecution(request.nodeType, request.nodeTypeVersion, request.nodeParameters);
        }
        catch (error) {
            const message = (0, get_error_message_1.getErrorMessage)(error);
            this.logger.debug('Node execution validation failed', {
                nodeType: request.nodeType,
                error: message,
            });
            return {
                status: 'error',
                data: [],
                error: `Cannot execute node "${request.nodeType}": ${message}`,
            };
        }
        const fromNames = (await this.resolveInlineCredentials(request.projectId, request.credentials)) ?? {};
        let fromDetails = {};
        if (request.credentialDetails && Object.keys(request.credentialDetails).length > 0) {
            fromDetails = await this.verifyCredentialDetailsForProject(request.projectId, request.credentialDetails);
        }
        const mergedCredentials = Object.keys(fromNames).length === 0 && Object.keys(fromDetails).length === 0
            ? null
            : { ...fromNames, ...fromDetails };
        const tool = {
            projectId: request.projectId,
            nodeType: request.nodeType,
            nodeTypeVersion: request.nodeTypeVersion,
            nodeParameters: request.nodeParameters,
            credentials: mergedCredentials,
            nodeName: request.nodeName,
            configureAdditionalData: request.configureAdditionalData,
        };
        const nodeType = this.nodeTypes.getByNameAndVersion(tool.nodeType, tool.nodeTypeVersion);
        if (typeof nodeType.supplyData === 'function') {
            return await this.invokeSupplyDataTool(tool, request.inputData);
        }
        return await this.executeNodeDirectly(tool, request.inputData);
    }
    async withSupplyDataTool(tool, inputItems, onTool) {
        const closeFunctions = [];
        try {
            const parts = await this.buildEphemeralContextParts(tool, inputItems);
            await this.enforceRunPolicy(parts.node, tool.projectId);
            const context = new n8n_core_1.SupplyDataContext(parts.workflow, parts.node, parts.additionalData, parts.mode, parts.runExecutionData, 0, inputItems, parts.inputData, n8n_workflow_1.NodeConnectionTypes.AiTool, parts.executeData, closeFunctions);
            const nodeType = this.nodeTypes.getByNameAndVersion(tool.nodeType, tool.nodeTypeVersion);
            const supplyData = nodeType.supplyData;
            if (typeof supplyData !== 'function') {
                return { ok: false, error: 'Node does not implement supplyData' };
            }
            return await (0, utils_1.withExpressionIsolate)(parts.workflow, async () => {
                const supplyDataResult = await supplyData.call(context, 0);
                const response = supplyDataResult.response;
                if (response instanceof n8n_core_1.StructuredToolkit) {
                    return { ok: true, value: await onTool(response) };
                }
                if (response && typeof response.invoke === 'function') {
                    return { ok: true, value: await onTool(response) };
                }
                return {
                    ok: false,
                    error: `Node "${tool.nodeType}" did not return a valid LangChain tool or toolkit`,
                };
            });
        }
        catch (error) {
            const violations = (0, policy_violation_error_1.findPolicyViolations)(error);
            return { ok: false, error: (0, get_error_message_1.getErrorMessage)(error), ...(violations && { violations }) };
        }
        finally {
            for (const closeFunction of closeFunctions) {
                try {
                    await closeFunction();
                }
                catch (error) {
                    this.logger.warn(`Error closing tool resource: ${String(error)}`);
                }
            }
        }
    }
    async invokeSupplyDataTool(tool, inputItems) {
        const toolArgs = (inputItems[0]?.json ?? {});
        const result = await this.withSupplyDataTool(tool, inputItems, async (response) => {
            if (response instanceof n8n_core_1.StructuredToolkit) {
                throw new Error(`Node "${tool.nodeType}" returned a StructuredToolkit (${response.tools.length} tools); multi-tool dispatch via the ephemeral runtime isn't supported yet.`);
            }
            return (await response.invoke(toolArgs));
        });
        if (!result.ok) {
            this.logger.debug('supplyData tool invocation failed', {
                nodeType: tool.nodeType,
                error: result.error,
            });
            return {
                status: 'error',
                data: [],
                error: result.error,
                ...(result.violations && { violations: result.violations }),
            };
        }
        return {
            status: 'success',
            data: [{ json: { response: result.value } }],
        };
    }
    async introspectSupplyDataToolSchema(tool) {
        let credentials = tool.credentials;
        if (credentials && Object.keys(credentials).length > 0) {
            try {
                credentials = await this.verifyCredentialDetailsForProject(tool.projectId, credentials);
            }
            catch (error) {
                this.logger.warn('supplyData tool introspection failed', {
                    nodeType: tool.nodeType,
                    error: (0, get_error_message_1.getErrorMessage)(error),
                });
                return null;
            }
        }
        const result = await this.withSupplyDataTool({ ...tool, credentials }, [], (response) => {
            if (response instanceof n8n_core_1.StructuredToolkit)
                return null;
            if (response instanceof tools_1.Tool)
                return null;
            const maybeSchema = response.schema;
            return maybeSchema ?? null;
        });
        if (!result.ok) {
            this.logger.warn('supplyData tool introspection failed', {
                nodeType: tool.nodeType,
                error: result.error,
            });
            return null;
        }
        return result.value;
    }
};
exports.EphemeralNodeExecutor = EphemeralNodeExecutor;
exports.EphemeralNodeExecutor = EphemeralNodeExecutor = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [node_types_1.NodeTypes, db_1.CredentialsRepository, db_1.SharedCredentialsRepository, backend_common_1.Logger, policy_enforcement_service_1.PolicyEnforcementService])
], EphemeralNodeExecutor);
//# sourceMappingURL=ephemeral-node-executor.js.map