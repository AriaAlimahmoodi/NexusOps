"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleFormRedirectionCase = void 0;
exports.handleHostedChatResponse = handleHostedChatResponse;
exports.getWorkflowWebhooks = getWorkflowWebhooks;
exports.autoDetectResponseMode = autoDetectResponseMode;
exports.setupResponseNodePromise = setupResponseNodePromise;
exports.invokeWebhook = invokeWebhook;
exports.checkTriggerCredentialGate = checkTriggerCredentialGate;
exports.handleImmediateWebhookResponse = handleImmediateWebhookResponse;
exports.prepareExecutionData = prepareExecutionData;
exports.executeWebhook = executeWebhook;
exports._privateGetWebhookErrorMessage = _privateGetWebhookErrorMessage;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const auth_1 = require("@n8n/backend-services/auth");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const inbound_auth_1 = require("@n8n/inbound-auth");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const is_record_1 = require("@n8n/utils/is-record");
const deferred_promise_1 = require("@n8n/utils/promise/deferred-promise");
const merge_1 = __importDefault(require("lodash/merge"));
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const node_stream_1 = require("node:stream");
const promises_1 = require("stream/promises");
const active_executions_1 = require("../active-executions");
const auth_service_1 = require("../auth/auth.service");
const constants_1 = require("../constants");
const errors_1 = require("@n8n/errors");
const execution_id_1 = require("../executions/execution-id");
const middlewares_1 = require("../middlewares");
const webhook_response_relay_1 = require("../scaling/webhook-response-relay");
const engine_v2_payload_files_service_1 = require("../services/engine-v2-payload-files.service");
const ownership_service_1 = require("../services/ownership.service");
const workflow_statistics_service_1 = require("../services/workflow-statistics.service");
const wait_tracker_1 = require("../wait-tracker");
const constants_2 = require("../webhooks/constants");
const webhook_execution_context_1 = require("../webhooks/webhook-execution-context");
const webhook_form_data_1 = require("../webhooks/webhook-form-data");
const webhook_last_node_response_extractor_1 = require("../webhooks/webhook-last-node-response-extractor");
const webhook_on_received_response_extractor_1 = require("../webhooks/webhook-on-received-response-extractor");
const webhook_response_1 = require("../webhooks/webhook-response");
const WorkflowExecuteAdditionalData = __importStar(require("../workflow-execute-additional-data"));
const WorkflowHelpers = __importStar(require("../workflow-helpers"));
const workflow_runner_1 = require("../workflow-runner");
const engine_v2_response_expectation_1 = require("./engine-v2-response-expectation");
const engine_v2_webhooks_1 = require("./engine-v2-webhooks");
const webhook_response_headers_1 = require("./webhook-response-headers");
const webhook_responder_1 = require("./webhook-responder");
const webhook_service_1 = require("./webhook.service");
const SUPPORTED_RESPONSE_MODES = new Set([
    'onReceived',
    'lastNode',
    'responseNode',
    'formPage',
    'streaming',
    'hostedChat',
]);
const IMMEDIATE_RESPONSE_MODES = new Set([
    'onReceived',
    'formPage',
    'hostedChat',
]);
const deferCleanupUntilStreamEnds = (stream, res, cleanup) => {
    let cleanupPromise;
    const cleanupOnce = async () => {
        cleanupPromise ??= cleanup();
        await cleanupPromise;
    };
    const cleanupOnClose = () => {
        stream.destroy();
        void cleanupOnce();
    };
    void (0, promises_1.finished)(stream).then(cleanupOnce, cleanupOnce);
    res.once('close', cleanupOnClose);
    if (res.closed) {
        res.off('close', cleanupOnClose);
        cleanupOnClose();
    }
};
function isMcpToolCall(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'toolName' in value &&
        typeof value.toolName === 'string' &&
        'arguments' in value &&
        typeof value.arguments === 'object');
}
function isMcpListToolsRelay(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'sessionId' in value &&
        typeof value.sessionId === 'string' &&
        'messageId' in value &&
        typeof value.messageId === 'string' &&
        'marker' in value);
}
async function prepareMcpQueueExecution(workflowStartNode, req, webhookResultData, runData) {
    const executionsConfig = di_1.Container.get(config_1.ExecutionsConfig);
    if (workflowStartNode.type !== constants_1.MCP_TRIGGER_NODE_TYPE || executionsConfig.mode !== 'queue') {
        return false;
    }
    const querySessionId = req.query?.sessionId;
    const headerSessionId = req.headers['mcp-session-id'];
    const mcpSessionId = typeof querySessionId === 'string'
        ? querySessionId
        : typeof headerSessionId === 'string'
            ? headerSessionId
            : '';
    const firstItem = webhookResultData.workflowData?.[0]?.[0];
    const mcpMessageId = (firstItem && 'json' in firstItem && typeof firstItem.json?.mcpMessageId === 'string'
        ? firstItem.json.mcpMessageId
        : null) ?? `mcp-trigger-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    runData.isMcpExecution = true;
    runData.mcpType = 'trigger';
    runData.callerAwaitsOutcome = 'completion';
    runData.mcpSessionId = mcpSessionId;
    runData.mcpMessageId = mcpMessageId;
    const mcpToolCallValue = firstItem && 'json' in firstItem ? firstItem.json?.mcpToolCall : null;
    if (isMcpToolCall(mcpToolCallValue)) {
        runData.mcpToolCall = mcpToolCallValue;
    }
    runData.mcpToolInput = webhookResultData.toolInput;
    const mcpListToolsRelayValue = firstItem && 'json' in firstItem ? firstItem.json?.mcpListToolsRelay : null;
    if (!isMcpListToolsRelay(mcpListToolsRelayValue))
        return false;
    const { Publisher } = await import('../scaling/pubsub/publisher.service.js');
    const publisher = di_1.Container.get(Publisher);
    await publisher.publishMcpRelay({
        sessionId: mcpListToolsRelayValue.sessionId,
        messageId: mcpListToolsRelayValue.messageId,
        response: mcpListToolsRelayValue.marker,
    });
    return true;
}
function handleHostedChatResponse(res, responseMode, executionId, responder, resumeToken) {
    if (responseMode !== 'hostedChat' || responder.hasResponded)
        return;
    res.send({ executionStarted: true, executionId, resumeToken });
    process.nextTick(() => res.end());
    responder.respondWithNoResponse();
}
function getWorkflowWebhooks(workflow, additionalData, destinationNode, ignoreRestartWebhooks = false) {
    const returnData = [];
    let parentNodes;
    if (destinationNode !== undefined) {
        parentNodes = workflow.getParentNodes(destinationNode.nodeName);
        if (destinationNode.mode === 'inclusive') {
            parentNodes.push(destinationNode.nodeName);
        }
    }
    for (const node of Object.values(workflow.nodes)) {
        if (parentNodes !== undefined && !parentNodes.includes(node.name)) {
            continue;
        }
        returnData.push.apply(returnData, di_1.Container.get(webhook_service_1.WebhookService).getNodeWebhooks(workflow, node, additionalData, ignoreRestartWebhooks));
    }
    return returnData;
}
const getChatResponseMode = (workflowStartNode, method) => {
    if (workflowStartNode.type !== n8n_workflow_1.CHAT_TRIGGER_NODE_TYPE)
        return undefined;
    if (method === 'GET')
        return 'onReceived';
    const { options } = workflowStartNode.parameters;
    if (method === 'POST' && options?.responseMode === 'responseNodes') {
        return 'hostedChat';
    }
    return undefined;
};
function isEnabledFormPageNode(node) {
    if (node.disabled)
        return false;
    if (node.type === n8n_workflow_1.FORM_NODE_TYPE)
        return true;
    return node.type === n8n_workflow_1.WAIT_NODE_TYPE && node.parameters.resume === 'form';
}
function autoDetectResponseMode(workflowStartNode, workflow, method) {
    const hasChildMatching = (predicate) => workflow
        .getChildNodes(workflowStartNode.name)
        .some((nodeName) => predicate(workflow.nodes[nodeName]));
    const isFormTriggerPost = workflowStartNode.type === n8n_workflow_1.FORM_TRIGGER_NODE_TYPE && method === 'POST';
    if (isFormTriggerPost && hasChildMatching(isEnabledFormPageNode))
        return 'formPage';
    const chatResponseMode = getChatResponseMode(workflowStartNode, method);
    if (chatResponseMode)
        return chatResponseMode;
    const isFormPost = workflowStartNode.type === n8n_workflow_1.FORM_NODE_TYPE && method === 'POST';
    if (isFormPost && hasChildMatching((node) => node.type === n8n_workflow_1.FORM_NODE_TYPE && !node.disabled))
        return 'formPage';
    if (workflowStartNode.type === n8n_workflow_1.WAIT_NODE_TYPE && workflowStartNode.parameters.resume !== 'form') {
        return undefined;
    }
    if (workflowStartNode.type === n8n_workflow_1.FORM_NODE_TYPE &&
        workflowStartNode.parameters.operation === 'completion') {
        return 'onReceived';
    }
    const isFormOrWaitPost = [n8n_workflow_1.FORM_NODE_TYPE, n8n_workflow_1.WAIT_NODE_TYPE].includes(workflowStartNode.type) && method === 'POST';
    if (isFormOrWaitPost && hasChildMatching(isEnabledFormPageNode))
        return 'responseNode';
    return undefined;
}
const handleFormRedirectionCase = (data, workflowStartNode) => {
    if (workflowStartNode.type === n8n_workflow_1.WAIT_NODE_TYPE && workflowStartNode.parameters.resume !== 'form') {
        return data;
    }
    if ([n8n_workflow_1.FORM_NODE_TYPE, n8n_workflow_1.FORM_TRIGGER_NODE_TYPE, n8n_workflow_1.WAIT_NODE_TYPE].includes(workflowStartNode.type) &&
        data?.headers?.location &&
        String(data?.responseCode).startsWith('3')) {
        const locationUrl = String(data?.headers?.location);
        let validatedUrl;
        try {
            validatedUrl = (0, n8n_workflow_1.tryToParseUrl)(locationUrl);
        }
        catch {
        }
        data.responseCode = 200;
        if (validatedUrl) {
            data.data = {
                redirectURL: validatedUrl,
            };
        }
        delete data.headers.location;
    }
    return data;
};
exports.handleFormRedirectionCase = handleFormRedirectionCase;
const { formDataFileSizeMax } = di_1.Container.get(config_1.GlobalConfig).endpoints;
const parseFormData = (0, webhook_form_data_1.createMultiFormDataParser)(formDataFileSizeMax);
function isHttpFullResponse(response) {
    return ((0, is_record_1.isRecord)(response) && (0, is_record_1.isRecord)(response.headers) && typeof response.statusCode === 'number');
}
async function sendResponseNodeResponse(response, res, responder, workflowStartNode, executionId, workflow) {
    try {
        const binaryData = response.body?.binaryData;
        if (binaryData?.id) {
            if (response.statusCode) {
                res.status(response.statusCode);
            }
            webhook_response_headers_1.WebhookResponseHeaders.fromObject(response.headers).applyToResponse(res);
            (0, webhook_response_headers_1.applySandboxCSP)(res);
            try {
                const stream = await di_1.Container.get(n8n_core_1.BinaryDataService).getAsStream(binaryData.id);
                res.once('close', () => stream.destroy());
                stream.pipe(res, { end: false });
                await (0, promises_1.finished)(stream);
            }
            finally {
                void di_1.Container.get(webhook_response_relay_1.WebhookResponseRelay).deleteOffloadedBody(response, {
                    workflowId: workflow.id,
                    executionId,
                });
            }
            responder.respondWithNoResponse();
        }
        else if (Buffer.isBuffer(response.body)) {
            if (response.statusCode) {
                res.status(response.statusCode);
            }
            webhook_response_headers_1.WebhookResponseHeaders.fromObject(response.headers).applyToResponse(res);
            (0, webhook_response_headers_1.applySandboxCSP)(res);
            res.end(response.body);
            responder.respondWithNoResponse();
        }
        else {
            let data = {
                data: response.body,
                headers: response.headers,
                responseCode: response.statusCode,
            };
            data = (0, exports.handleFormRedirectionCase)(data, workflowStartNode);
            responder.respondWith(data);
        }
        process.nextTick(() => res.end());
    }
    catch (e) {
        const error = (0, ensure_error_1.ensureError)(e);
        di_1.Container.get(n8n_core_1.ErrorReporter).error(error);
        di_1.Container.get(backend_common_1.Logger).error(`Error with Webhook-Response for execution "${executionId}": "${error.message}"`, { executionId, workflowId: workflow.id });
        responder.respondWithError(error);
    }
}
function setupResponseNodePromise(responsePromise, res, responder, workflowStartNode, executionId, workflow) {
    void responsePromise.promise
        .then(async (response) => {
        if (response === constants_2.EXECUTION_ENDED_WITHOUT_RESPONSE) {
            return;
        }
        await sendResponseNodeResponse(response, res, responder, workflowStartNode, executionId, workflow);
    })
        .catch(async (e) => {
        const error = (0, ensure_error_1.ensureError)(e);
        di_1.Container.get(n8n_core_1.ErrorReporter).error(error);
        di_1.Container.get(backend_common_1.Logger).error(`Error with Webhook-Response for execution "${executionId}": "${error.message}"`, { executionId, workflowId: workflow.id });
        responder.respondWithError(error);
    });
}
function shouldEstablishTriggerIdentity(workflowStartNode) {
    return (workflowStartNode.type === n8n_workflow_1.WEBHOOK_NODE_TYPE &&
        workflowStartNode.parameters?.authentication === 'n8nOAuth2');
}
async function invokeWebhook({ workflow, webhookData, workflowStartNode, additionalData, executionMode, runExecutionData, webhookType, responder, }) {
    try {
        const webhookResultData = await di_1.Container.get(webhook_service_1.WebhookService).runWebhook(workflow, webhookData, workflowStartNode, additionalData, executionMode, runExecutionData ?? null);
        di_1.Container.get(workflow_statistics_service_1.WorkflowStatisticsService).emit('nodeFetchedData', {
            workflowId: workflow.id,
            node: workflowStartNode,
        });
        return { webhookResultData, runExecutionDataChanges: {}, failed: false };
    }
    catch (e) {
        const error = (0, ensure_error_1.ensureError)(e);
        const errorMessage = _privateGetWebhookErrorMessage(error, webhookType);
        di_1.Container.get(n8n_core_1.ErrorReporter).error(error, {
            extra: {
                nodeName: workflowStartNode.name,
                nodeType: workflowStartNode.type,
                nodeVersion: workflowStartNode.typeVersion,
                workflowId: workflow.id,
            },
        });
        responder.respondWithError(new n8n_workflow_1.UnexpectedError(errorMessage));
        return {
            runExecutionDataChanges: {
                resultData: {
                    runData: {},
                    lastNodeExecuted: workflowStartNode.name,
                    error: {
                        ...error,
                        message: error.message,
                        stack: error.stack,
                    },
                },
            },
            webhookResultData: {
                noWebhookResponse: true,
                workflowData: [[{ json: {} }]],
            },
            failed: true,
        };
    }
}
async function checkTriggerCredentialGate({ workflowStartNode, additionalData, res, responder, }) {
    if (responder.hasResponded ||
        res.headersSent ||
        !shouldEstablishTriggerIdentity(workflowStartNode)) {
        return true;
    }
    const credentialGate = await additionalData.checkTriggerCredentialStatus?.();
    if (!credentialGate || credentialGate.readyToExecute) {
        return true;
    }
    responder.respondWith({
        data: credentialGate,
        responseCode: 428,
    });
    return false;
}
function handleImmediateWebhookResponse({ webhookResultData, responseCode, responder, }) {
    if (webhookResultData.noWebhookResponse === true && !responder.hasResponded) {
        responder.respondWithNoResponse();
    }
    if (webhookResultData.workflowData !== undefined)
        return true;
    if (!responder.hasResponded) {
        responder.respondWith({
            data: webhookResultData.webhookResponse !== undefined
                ? webhookResultData.webhookResponse
                : { message: 'Webhook call received' },
            responseCode,
        });
    }
    return false;
}
function reconcileSeededExecutionStack(workflowStartNode, runExecutionData, nodeExecutionStack) {
    const executionData = runExecutionData?.executionData;
    if (!executionData?.nodeExecutionStack)
        return;
    if ([constants_1.MCP_TRIGGER_NODE_TYPE, n8n_workflow_1.MICROSOFT_AGENT365_TRIGGER_NODE_TYPE, n8n_workflow_1.CHAT_TRIGGER_NODE_TYPE].includes(workflowStartNode.type)) {
        (0, merge_1.default)(executionData.nodeExecutionStack, nodeExecutionStack);
    }
    else if (shouldEstablishTriggerIdentity(workflowStartNode)) {
        executionData.nodeExecutionStack = nodeExecutionStack;
    }
}
function prepareExecutionData(executionMode, workflowStartNode, webhookResultData, runExecutionData, runExecutionDataMerge = {}, destinationNode, executionId, workflowData, userId) {
    const nodeExecutionStack = [
        {
            node: workflowStartNode,
            data: {
                main: webhookResultData.workflowData ?? [],
            },
            source: null,
        },
    ];
    reconcileSeededExecutionStack(workflowStartNode, runExecutionData, nodeExecutionStack);
    runExecutionData ??= (0, n8n_workflow_1.createRunExecutionData)({
        executionData: {
            nodeExecutionStack,
        },
        ...(executionMode === 'manual' && userId ? { manualData: { userId } } : {}),
    });
    if (destinationNode && runExecutionData.startData) {
        runExecutionData.startData.destinationNode = destinationNode;
    }
    if (executionId !== undefined) {
        const resumingNodeExecutionData = runExecutionData.executionData.nodeExecutionStack[0];
        resumingNodeExecutionData.data.main = webhookResultData.workflowData ?? [];
        resumingNodeExecutionData.metadata = {
            ...resumingNodeExecutionData.metadata,
            forwardAllOutputs: true,
        };
    }
    if (Object.keys(runExecutionDataMerge).length !== 0) {
        Object.assign(runExecutionData, runExecutionDataMerge);
    }
    let pinData;
    const usePinData = ['manual', 'evaluation'].includes(executionMode);
    if (usePinData) {
        pinData = workflowData?.pinData;
        runExecutionData.resultData.pinData = pinData;
    }
    return { runExecutionData, pinData };
}
async function bindingOf(claim) {
    if (!claim)
        return undefined;
    const source = await di_1.Container.get(inbound_auth_1.TrustedSourceStore).getById(claim.sourceId);
    if (source?.config.identity.subject !== 'binding')
        return undefined;
    return { sourceId: claim.sourceId, subject: claim.subject };
}
function toWebhookUser(user) {
    return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
    };
}
async function prepareWebhookAdditionalData({ workflow, workflowStartNode, executionMode, executionId, projectId, req, res, encryptedRunnerIdentity, getRunExecutionData, }) {
    const additionalData = await WorkflowExecuteAdditionalData.getBase({ projectId });
    if (encryptedRunnerIdentity) {
        additionalData.encryptedRunnerIdentity = encryptedRunnerIdentity;
    }
    if (executionId) {
        additionalData.executionId = executionId;
    }
    additionalData.httpRequest = req;
    additionalData.httpResponse = res;
    const authService = di_1.Container.get(auth_service_1.AuthService);
    additionalData.validateCookieAuth = async (token) => {
        const user = await authService.validateCookieToken(token);
        return toWebhookUser(user);
    };
    additionalData.getUserById = async (id) => {
        const user = await di_1.Container.get(db_1.UserRepository).findByIdWithRole(id);
        if (!user)
            return undefined;
        return toWebhookUser(user);
    };
    const oauth2FlowProxy = di_1.Container.get(auth_1.OAuth2FlowProxy);
    additionalData.beginN8nOAuth2Flow = oauth2FlowProxy.begin.bind(oauth2FlowProxy);
    additionalData.completeN8nOAuth2Flow = async (code, state) => await oauth2FlowProxy.complete(code, state, {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip ?? '',
    });
    additionalData.refreshN8nOAuth2Flow = oauth2FlowProxy.refresh.bind(oauth2FlowProxy);
    let admittedBy;
    additionalData.validateN8nOAuth2Token = async (token, resourceUrl) => {
        const resource = await di_1.Container.get(auth_1.ProtectedResourceRegistry).getByResourceUrl(resourceUrl);
        if (!resource)
            return { valid: false, reason: 'invalid_token' };
        const admission = di_1.Container.get(inbound_auth_1.ResourceAdmission);
        const admitted = await admission.admitBearer(resource, { method: req.method, url: req.originalUrl, ip: req.ip ?? '' }, token);
        if (!admitted.ok) {
            return {
                valid: false,
                reason: admitted.reason === 'insufficient_scope' ? 'insufficient_scope' : 'invalid_token',
                challenge: await admission.challenge(admitted),
            };
        }
        const { context } = admitted;
        req.ctx = { ...req.ctx, security: context };
        admittedBy = {
            resource: resourceUrl,
            grant: resource.getGrant?.(),
            binding: await bindingOf(context.subjectClaim),
        };
        const { subject } = context;
        return {
            valid: true,
            user: {
                id: subject.id,
                email: subject.email ?? '',
                firstName: subject.firstName ?? '',
                lastName: subject.lastName ?? '',
            },
        };
    };
    additionalData.establishTriggerIdentity = async (token, resource, subject) => {
        const grant = admittedBy?.resource === resource
            ? admittedBy.grant
            : (await di_1.Container.get(auth_1.ProtectedResourceRegistry).getByResourceUrl(resource))?.getGrant?.();
        if (!grant) {
            di_1.Container.get(backend_common_1.Logger).error('Cannot establish a trigger identity without a resource grant', {
                workflowId: workflow.id,
                resource,
            });
            throw new n8n_workflow_1.UnexpectedError('Cannot establish a trigger identity without a resource grant');
        }
        const binding = admittedBy?.resource === resource ? admittedBy.binding : undefined;
        additionalData.encryptedRunnerIdentity = await di_1.Container.get(n8n_core_1.ExecutionContextService).buildTriggerIdentityCredentials(token, resource, grant, subject, binding);
        const runExecutionData = getRunExecutionData();
        if (runExecutionData) {
            await (0, n8n_core_1.establishExecutionContext)(workflow, runExecutionData, additionalData, executionMode);
        }
    };
    additionalData.checkTriggerCredentialStatus = async () => {
        const credentialCheckProxy = additionalData['dynamic-credentials']?.credentialCheckProxy;
        if (!credentialCheckProxy || !workflow.id) {
            return undefined;
        }
        const runExecutionData = getRunExecutionData();
        const executionContext = runExecutionData?.executionData?.runtimeData ??
            (additionalData.encryptedRunnerIdentity
                ? {
                    credentials: additionalData.encryptedRunnerIdentity,
                }
                : undefined);
        if (!executionContext) {
            return undefined;
        }
        if (!executionContext.credentials) {
            return undefined;
        }
        const rootNodes = [
            ...(0, n8n_workflow_1.getExecutableNodeNames)(workflow.connectionsBySourceNode, workflow.connectionsByDestinationNode, workflowStartNode.name),
        ]
            .map((nodeName) => workflow.nodes[nodeName])
            .filter((node) => node !== undefined);
        return await credentialCheckProxy.checkCredentialStatus(workflow.id, executionContext, {
            rootNodes,
        });
    };
    return additionalData;
}
async function executeWebhook(workflow, webhookData, workflowData, workflowStartNode, executionMode, pushRef, runExecutionData, executionId, req, res, responseCallback, destinationNode, options) {
    const responder = new webhook_responder_1.WebhookResponder(responseCallback);
    const nodeType = workflow.nodeTypes.getByNameAndVersion(workflowStartNode.type, workflowStartNode.typeVersion);
    const additionalKeys = {
        $executionId: executionId,
    };
    const context = new webhook_execution_context_1.WebhookExecutionContext(workflow, workflowStartNode, webhookData, executionMode, additionalKeys);
    let project;
    try {
        project = await di_1.Container.get(ownership_service_1.OwnershipService).getWorkflowProjectCached(workflowData.id);
    }
    catch {
        throw new errors_1.NotFoundError('Cannot find workflow');
    }
    const additionalData = await prepareWebhookAdditionalData({
        workflow,
        workflowStartNode,
        executionMode,
        executionId,
        projectId: project?.id,
        req,
        res,
        encryptedRunnerIdentity: options?.encryptedRunnerIdentity,
        getRunExecutionData: () => runExecutionData,
    });
    const { responseMode, responseCode, responseData, checkAllMainOutputs, responsePropertyName, responseContentType, responseBinaryPropertyName, } = evaluateResponseOptions(context, req);
    if (!SUPPORTED_RESPONSE_MODES.has(responseMode)) {
        const errorMessage = `The response mode '${responseMode}' is not valid!`;
        responder.respondWithError(new n8n_workflow_1.UnexpectedError(errorMessage));
        throw new errors_1.InternalServerError(errorMessage);
    }
    let routesToEngineV2 = false;
    let engineV2ExecutionId;
    let engineV2Payload;
    let pendingEngineV2Response;
    let runExecutionDataMerge = {};
    const engineV2Webhooks = di_1.Container.get(engine_v2_webhooks_1.EngineV2Webhooks);
    let cleanupMultipartFiles;
    try {
        routesToEngineV2 = engineV2Webhooks.handles(workflowData, executionMode);
        if (routesToEngineV2) {
            engineV2Webhooks.assertSupported({ workflowStartNode, responseMode, executionId });
            engineV2ExecutionId = (0, execution_id_1.createExecutionIdV2)();
            additionalData.executionId = engineV2ExecutionId;
        }
        if (req.method === 'POST' &&
            requiresMultipartFormData(workflowStartNode) &&
            req.contentType !== 'multipart/form-data') {
            throw new errors_1.UnsupportedMediaTypeError('Expected multipart/form-data');
        }
        cleanupMultipartFiles = await parseRequestBody(req, workflowStartNode, workflow, executionMode, additionalKeys);
        if ([
            constants_1.MCP_TRIGGER_NODE_TYPE,
            n8n_workflow_1.MICROSOFT_AGENT365_TRIGGER_NODE_TYPE,
            n8n_workflow_1.CHAT_TRIGGER_NODE_TYPE,
        ].includes(workflowStartNode.type) ||
            shouldEstablishTriggerIdentity(workflowStartNode)) {
            const nodeExecutionStack = [];
            nodeExecutionStack.push({
                node: workflowStartNode,
                data: {
                    main: [],
                },
                source: null,
            });
            runExecutionData =
                runExecutionData ??
                    (0, n8n_workflow_1.createRunExecutionData)({
                        executionData: {
                            nodeExecutionStack,
                        },
                        ...(executionMode === 'manual' && webhookData.userId
                            ? { manualData: { userId: webhookData.userId } }
                            : {}),
                    });
        }
        const invocationResult = await invokeWebhook({
            workflow,
            webhookData,
            workflowStartNode,
            additionalData,
            executionMode,
            runExecutionData,
            webhookType: ['formTrigger', 'form'].includes(nodeType.description.name) ? 'Form' : 'Webhook',
            responder,
        });
        if (invocationResult.failed && executionId !== undefined)
            return;
        const { webhookResultData } = invocationResult;
        runExecutionDataMerge = invocationResult.runExecutionDataChanges;
        if (routesToEngineV2)
            engineV2Payload = webhookResultData.workflowData;
        if (cleanupMultipartFiles && webhookResultData.webhookResponse instanceof node_stream_1.Readable) {
            deferCleanupUntilStreamEnds(webhookResultData.webhookResponse, res, cleanupMultipartFiles);
        }
        else {
            await cleanupMultipartFiles?.();
        }
        cleanupMultipartFiles = undefined;
        const responseHeaders = evaluateResponseHeaders(context);
        if (!res.headersSent && responseHeaders) {
            responseHeaders.applyToResponse(res);
        }
        const shouldContinueWorkflowExecution = handleImmediateWebhookResponse({
            webhookResultData,
            responseCode,
            responder,
        });
        if (!shouldContinueWorkflowExecution)
            return;
        const shouldContinueAfterCredentialGate = await checkTriggerCredentialGate({
            workflowStartNode,
            additionalData,
            res,
            responder,
        });
        if (!shouldContinueAfterCredentialGate)
            return;
        const shouldDeferOnReceivedResponse = responseMode === 'onReceived' && !responder.hasResponded;
        const { runExecutionData: preparedRunExecutionData, pinData } = prepareExecutionData(executionMode, workflowStartNode, webhookResultData, runExecutionData, runExecutionDataMerge, destinationNode, executionId, workflowData, webhookData.userId);
        runExecutionData = preparedRunExecutionData;
        const runData = {
            executionMode,
            executionData: runExecutionData,
            pushRef,
            workflowData,
            pinData,
            projectId: project?.id,
            projectName: project?.name,
            userId: webhookData.userId,
            encryptedRunnerIdentity: additionalData.encryptedRunnerIdentity,
            callerAwaitsOutcome: IMMEDIATE_RESPONSE_MODES.has(responseMode) ? 'none' : 'response',
            destinationNode,
        };
        if (!runData.pushRef) {
            runData.pushRef = runExecutionData.pushRef;
        }
        const didPublishMcpRelay = await prepareMcpQueueExecution(workflowStartNode, req, webhookResultData, runData);
        if (didPublishMcpRelay)
            return undefined;
        let responsePromise;
        if (responseMode === 'responseNode' && !routesToEngineV2) {
            responsePromise = (0, deferred_promise_1.createDeferredPromise)();
            void responsePromise.promise.then((response) => {
                if (response !== constants_2.EXECUTION_ENDED_WITHOUT_RESPONSE)
                    responder.markResponded();
            }, () => {
                responder.markResponded();
            });
            setupResponseNodePromise(responsePromise, res, responder, workflowStartNode, executionId, workflow);
        }
        if (responseMode === 'streaming') {
            di_1.Container.get(backend_common_1.Logger).debug(`Execution of workflow "${workflow.name}" from with ID ${executionId} is set to streaming`, { executionId });
            if (!routesToEngineV2)
                runData.httpResponse = res;
            runData.streamingEnabled = true;
            responder.markResponded();
        }
        if (engineV2ExecutionId !== undefined) {
            if (responseMode === 'lastNode' ||
                responseMode === 'responseNode' ||
                responseMode === 'streaming') {
                const { EngineV2WebhookResponseRegistry } = await import('../modules/engine-v2/webhook-response/webhook-response-registry.service.js');
                pendingEngineV2Response = await di_1.Container.get(EngineV2WebhookResponseRegistry).waitForResponse(engineV2ExecutionId, (0, engine_v2_response_expectation_1.toResponseExpectation)(responseMode), res);
                runData.engineV2Response = { responseMode };
            }
            runData.engineV2ExecutionId = engineV2ExecutionId;
        }
        const traceparent = req.headers.traceparent;
        if (typeof traceparent === 'string' &&
            /^00-[0-9a-f]{32}-[0-9a-f]{16}-[0-9a-f]{2}$/.test(traceparent)) {
            const tracestate = req.headers.tracestate;
            runData.tracingContext = {
                traceparent,
                tracestate: typeof tracestate === 'string' && tracestate.length <= 512 ? tracestate : undefined,
            };
        }
        engineV2Payload = undefined;
        if (executionId)
            options?.onResume?.();
        executionId = await di_1.Container.get(workflow_runner_1.WorkflowRunner).run(runData, true, !responder.hasResponded && !shouldDeferOnReceivedResponse, executionId
            ? { executionId, expectedStatus: 'waiting', storedAt: options?.storedAt }
            : undefined, responsePromise);
        if (!routesToEngineV2) {
            di_1.Container.get(active_executions_1.ActiveExecutions).setResponseMode(executionId, responseMode);
        }
        if (shouldDeferOnReceivedResponse) {
            additionalKeys.$executionId = executionId;
            additionalKeys.$execution = {
                id: executionId,
                mode: executionMode === 'manual' ? 'test' : 'production',
                resumeUrl: `${additionalData.webhookWaitingBaseUrl}/${executionId}`,
                resumeFormUrl: `${additionalData.formWaitingBaseUrl}/${executionId}`,
            };
            const evaluatedResponseData = context.evaluateComplexWebhookDescriptionExpression('responseData', undefined, 'firstEntryJson');
            const responseBody = (0, webhook_on_received_response_extractor_1.extractWebhookOnReceivedResponse)(evaluatedResponseData, webhookResultData);
            const webhookResponse = (0, webhook_response_1.createStaticResponse)(responseBody, responseCode, responseHeaders);
            responder.respondWith(webhookResponse);
        }
        di_1.Container.get(backend_services_1.EventService).emit('workflow-executed', {
            workflowId: workflowData.id,
            workflowName: workflowData.name,
            executionId,
            projectId: project.id,
            projectName: project.name,
            source: 'webhook',
        });
        if (responseMode === 'formPage' && !responder.hasResponded) {
            const formUrl = new URL(`${additionalData.formWaitingBaseUrl}/${executionId}`);
            if (runExecutionData.resumeToken) {
                formUrl.searchParams.set(n8n_core_1.WAITING_TOKEN_QUERY_PARAM, runExecutionData.resumeToken);
            }
            res.send({ formWaitingUrl: formUrl.toString() });
            process.nextTick(() => res.end());
            responder.respondWithNoResponse();
        }
        handleHostedChatResponse(res, responseMode, executionId, responder, runExecutionData?.resumeToken);
        di_1.Container.get(backend_common_1.Logger).debug(`Started execution of workflow "${workflow.name}" from webhook with execution ID ${executionId}`, { executionId });
        if (routesToEngineV2 && responseMode === 'onReceived')
            return executionId;
        const waitForDataPlaneRun = async (waiting) => {
            const outcome = await waiting.outcome;
            if (outcome.status === 'response') {
                if (!isHttpFullResponse(outcome.response)) {
                    throw new n8n_workflow_1.UnexpectedError('Engine v2 produced an invalid webhook response');
                }
                responder.markResponded();
                await sendResponseNodeResponse(outcome.response, res, responder, workflowStartNode, executionId, workflow);
                return undefined;
            }
            if (outcome.status === 'completed' || outcome.status === 'failed') {
                if (outcome.status === 'completed' && responseMode === 'responseNode') {
                    responder.respondWith({ data: undefined, responseCode });
                    return undefined;
                }
                return await engineV2Webhooks.toRun(outcome, executionMode);
            }
            const errorResponse = toUnansweredRunResponse(outcome);
            di_1.Container.get(backend_common_1.Logger).warn(errorResponse.logMessage, {
                executionId,
                workflowId: workflowData.id,
                ...(outcome.status === 'undeliverable' ? { error: outcome.error } : {}),
            });
            if (!responder.hasResponded) {
                responder.respondWith({
                    data: { message: errorResponse.responseMessage },
                    responseCode: errorResponse.responseCode,
                });
            }
            return undefined;
        };
        const executePromise = pendingEngineV2Response
            ? waitForDataPlaneRun(pendingEngineV2Response)
            : di_1.Container.get(active_executions_1.ActiveExecutions).getPostExecutePromise(executionId);
        const { parentExecution } = runExecutionData;
        if (WorkflowHelpers.shouldRestartParentExecution(parentExecution)) {
            void di_1.Container.get(wait_tracker_1.WaitTracker).resumeParentExecution(parentExecution, executePromise, { executionId, workflowId: workflowData.id }, workflowData);
        }
        if (!responder.hasResponded) {
            executePromise
                .then(async (runData) => {
                if (runData === undefined) {
                    if (!responder.hasResponded) {
                        responder.respondWith({
                            data: {
                                message: 'Workflow executed successfully but no data was returned',
                            },
                            responseCode,
                        });
                    }
                    return undefined;
                }
                if (pinData) {
                    runData.data.resultData.pinData = pinData;
                }
                const lastNodeTaskData = WorkflowHelpers.getLastExecutedNodeData(runData);
                if (runData.data.resultData.error || lastNodeTaskData?.error !== undefined) {
                    if (!responder.hasResponded) {
                        di_1.Container.get(backend_common_1.Logger).warn('Webhook execution failed before a response was sent', {
                            executionId,
                            workflowId: workflowData.id,
                            responseMode,
                            lastNodeExecuted: runData.data.resultData.lastNodeExecuted,
                        });
                        responder.respondWith({
                            data: {
                                message: 'Error in workflow',
                            },
                            responseCode: 500,
                        });
                    }
                    return runData;
                }
                if (responseMode === 'responseNode' && responsePromise) {
                    await Promise.allSettled([responsePromise.promise]);
                    if (!responder.hasResponded) {
                        responder.respondWith({ data: undefined, responseCode });
                    }
                    return undefined;
                }
                if (lastNodeTaskData === undefined) {
                    if (!responder.hasResponded) {
                        responder.respondWith({
                            data: {
                                message: 'Workflow executed successfully but the last node did not return any data',
                            },
                            responseCode,
                        });
                    }
                    return runData;
                }
                if (responder.hasResponded) {
                    return runData;
                }
                const result = await (0, webhook_last_node_response_extractor_1.extractWebhookLastNodeResponse)(responseData, lastNodeTaskData, checkAllMainOutputs, { responsePropertyName, responseContentType, responseBinaryPropertyName });
                if (!result.ok) {
                    responder.respondWithError(result.error);
                    return runData;
                }
                const response = result.result;
                if (response.contentType) {
                    responseHeaders.set('content-type', response.contentType);
                }
                responder.respondWith(response.type === 'static'
                    ? (0, webhook_response_1.createStaticResponse)(response.body, responseCode, responseHeaders)
                    : (0, webhook_response_1.createStreamResponse)(response.stream, responseCode, responseHeaders));
                return runData;
            })
                .catch((e) => {
                const error = (0, ensure_error_1.ensureError)(e);
                di_1.Container.get(n8n_core_1.ErrorReporter).error(error, { executionId });
                if (!responder.hasResponded) {
                    responder.respondWithError(new n8n_workflow_1.OperationalError('There was a problem executing the workflow', {
                        cause: error,
                    }));
                }
                const internalServerError = new errors_1.InternalServerError(error.message, error);
                if (error instanceof n8n_workflow_1.ExecutionCancelledError)
                    internalServerError.level = 'warning';
                throw internalServerError;
            });
        }
        return executionId;
    }
    catch (e) {
        pendingEngineV2Response?.release();
        if (routesToEngineV2 && responseMode === 'streaming' && res.headersSent && !res.writableEnded) {
            res.end();
        }
        const error = (0, ensure_error_1.ensureError)(e);
        let responseError;
        if (error instanceof errors_1.ResponseError && error.httpStatusCode < 500) {
            responseError = error;
        }
        else if (routesToEngineV2 && error instanceof n8n_workflow_1.UserError) {
            responseError = new errors_1.BadRequestError(error.message);
        }
        else {
            di_1.Container.get(n8n_core_1.ErrorReporter).error(error, { executionId });
            responseError = new n8n_workflow_1.OperationalError('There was a problem executing the workflow', {
                cause: error,
            });
        }
        if (responder.hasResponded)
            throw responseError;
        responder.respondWithError(responseError);
        return;
    }
    finally {
        await cleanupMultipartFiles?.();
        if (engineV2Payload !== undefined) {
            await di_1.Container.get(engine_v2_payload_files_service_1.EngineV2PayloadFiles).discard(engineV2Payload);
        }
    }
}
function evaluateResponseOptions(context, req) {
    const { workflow, workflowStartNode } = context;
    const responseMode = autoDetectResponseMode(workflowStartNode, workflow, req.method) ??
        context.evaluateSimpleWebhookDescriptionExpression('responseMode', undefined, 'onReceived');
    const responseCode = context.evaluateSimpleWebhookDescriptionExpression('responseCode', undefined, 200);
    const responseData = context.evaluateComplexWebhookDescriptionExpression('responseData', undefined, 'firstEntryJson');
    const checkAllMainOutputs = workflowStartNode.type === n8n_workflow_1.CHAT_TRIGGER_NODE_TYPE;
    const responsePropertyName = context.evaluateSimpleWebhookDescriptionExpression('responsePropertyName');
    const responseContentType = context.evaluateSimpleWebhookDescriptionExpression('responseContentType');
    const responseBinaryPropertyName = context.evaluateSimpleWebhookDescriptionExpression('responseBinaryPropertyName', undefined, 'data');
    return {
        responseMode,
        responseCode,
        responseData,
        checkAllMainOutputs,
        responsePropertyName,
        responseContentType,
        responseBinaryPropertyName,
    };
}
function requiresMultipartFormData(node) {
    if (node.type === n8n_workflow_1.FORM_TRIGGER_NODE_TYPE)
        return true;
    if (node.type === n8n_workflow_1.FORM_NODE_TYPE)
        return node.parameters.operation !== 'completion';
    if (node.type === n8n_workflow_1.WAIT_NODE_TYPE)
        return node.parameters.resume === 'form';
    return (node.parameters.operation === n8n_workflow_1.SEND_AND_WAIT_OPERATION &&
        node.parameters.responseType === 'customForm');
}
function isParsableContentType(contentType) {
    if (!contentType)
        return false;
    return (contentType.startsWith('application/json') ||
        contentType.startsWith('text/plain') ||
        contentType.startsWith('application/x-www-form-urlencoded') ||
        contentType.endsWith('/xml') ||
        contentType.endsWith('+xml'));
}
async function parseRequestBody(req, workflowStartNode, workflow, executionMode, additionalKeys) {
    let binaryData;
    const nodeVersion = workflowStartNode.typeVersion;
    if (nodeVersion === 1) {
        binaryData = workflow.expression.getSimpleParameterValue(workflowStartNode, '={{$parameter["options"]["binaryData"]}}', executionMode, additionalKeys, undefined, false);
    }
    if (binaryData) {
        return;
    }
    const { contentType } = req;
    if (contentType === 'multipart/form-data') {
        const { body, cleanup } = await parseFormData(req);
        req.body = body;
        return cleanup;
    }
    if (nodeVersion > 1 && !isParsableContentType(contentType))
        return undefined;
    await (0, middlewares_1.parseBody)(req);
    return undefined;
}
function evaluateResponseHeaders(context) {
    const headers = new webhook_response_headers_1.WebhookResponseHeaders();
    if (context.webhookData.webhookDescription.responseHeaders === undefined) {
        return headers;
    }
    const evaluatedHeaders = context.evaluateComplexWebhookDescriptionExpression('responseHeaders');
    if (evaluatedHeaders) {
        headers.addFromNodeHeaders(evaluatedHeaders);
    }
    return headers;
}
function _privateGetWebhookErrorMessage(error, webhookType) {
    if (error instanceof n8n_workflow_1.NodeOperationError && error.type === 'manual-form-test') {
        return error.message;
    }
    if (error instanceof n8n_workflow_1.WorkflowConfigurationError) {
        return error.message;
    }
    return `Workflow ${webhookType} Error: Workflow could not be started!`;
}
function toUnansweredRunResponse(outcome) {
    switch (outcome.status) {
        case 'undeliverable':
            return {
                logMessage: 'Could not deliver an engine v2 webhook response',
                responseMessage: outcome.error.message,
                responseCode: 500,
            };
        case 'cancelled':
            return {
                logMessage: 'An engine v2 webhook run was cancelled',
                responseMessage: 'The execution was cancelled',
                responseCode: 500,
            };
        case 'timeout':
            return {
                logMessage: 'No answer arrived for an engine v2 webhook run',
                responseMessage: 'The workflow did not answer in time',
                responseCode: 504,
            };
    }
}
//# sourceMappingURL=webhook-helpers.js.map