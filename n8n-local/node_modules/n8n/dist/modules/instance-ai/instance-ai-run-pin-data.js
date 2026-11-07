"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildInstanceAiRunPinDataPlan = buildInstanceAiRunPinDataPlan;
exports.sdkPinDataToRuntime = sdkPinDataToRuntime;
exports.pruneUnreachedVerificationPinData = pruneUnreachedVerificationPinData;
exports.getPrunedVerificationPinData = getPrunedVerificationPinData;
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const execution_persistence_1 = require("../../executions/execution-persistence");
const trigger_run_data_1 = require("./trigger-run-data");
function buildInstanceAiRunPinDataPlan(args) {
    const workflowPinData = args.workflowPinData;
    const verificationPinData = sdkPinDataToRuntime(args.verificationPinData);
    const basePinData = { ...workflowPinData, ...verificationPinData };
    let nonVerificationPinData = { ...workflowPinData };
    const mockDataSources = [];
    if (args.inputData && args.triggerNode) {
        mockDataSources.push('trigger_input');
    }
    if (Object.keys(verificationPinData).length > 0) {
        mockDataSources.push('verification_pin_data');
    }
    if (Object.keys(workflowPinData).length > 0) {
        mockDataSources.push('workflow_pin_data');
    }
    if (args.inputData && args.triggerNode) {
        const triggerPinData = getPinDataForTrigger(args.triggerNode, args.inputData);
        const runPinData = { ...basePinData, ...triggerPinData };
        nonVerificationPinData = { ...nonVerificationPinData, ...triggerPinData };
        const triggerItems = triggerPinData[args.triggerNode.name];
        return {
            runPinData,
            nonVerificationPinData,
            verificationPinData,
            mockDataSources,
            startNodeName: args.triggerNode.name,
            triggerItems,
            triggerExecutionData: (0, trigger_run_data_1.createTriggerExecutionData)({
                triggerNode: args.triggerNode,
                pinData: runPinData,
                triggerItems,
            }),
        };
    }
    const runPinData = Object.keys(basePinData).length > 0 ? basePinData : undefined;
    return {
        runPinData,
        nonVerificationPinData,
        verificationPinData,
        mockDataSources,
        triggerExecutionData: args.triggerNode
            ? (0, trigger_run_data_1.createTriggerExecutionData)({ triggerNode: args.triggerNode, pinData: runPinData })
            : undefined,
    };
}
function sdkPinDataToRuntime(pinData) {
    if (!pinData)
        return {};
    return Object.fromEntries(Object.entries(pinData).map(([nodeName, items]) => [
        nodeName,
        items.map((item) => ({ json: (item ?? {}) })),
    ]));
}
async function pruneUnreachedVerificationPinData(args) {
    const { executionId, verificationPinData, nonVerificationPinData, executedNodeNames } = args;
    const verificationNodeNames = Object.keys(verificationPinData);
    if (verificationNodeNames.length === 0)
        return;
    const executionPersistence = di_1.Container.get(execution_persistence_1.ExecutionPersistence);
    const execution = await executionPersistence.findSingleExecution(executionId, {
        includeData: true,
        unflattenData: true,
    });
    const executionData = execution?.data;
    const resultData = executionData?.resultData;
    const persistedPinData = resultData?.pinData;
    if (!executionData || !resultData || !persistedPinData)
        return;
    const nextPinData = getPrunedVerificationPinData({
        persistedPinData,
        verificationPinData,
        nonVerificationPinData,
        reachedNodeNames: executedNodeNames ?? Object.keys(resultData.runData ?? {}),
    });
    if (!nextPinData)
        return;
    const nextExecutionData = {
        ...executionData,
        resultData: {
            ...resultData,
            pinData: nextPinData,
        },
    };
    await executionPersistence.updateExistingExecution(executionId, {
        data: nextExecutionData,
    });
}
function getPrunedVerificationPinData(args) {
    const reachedNodeNames = new Set(args.reachedNodeNames);
    let nextPinData;
    for (const nodeName of Object.keys(args.verificationPinData)) {
        if (reachedNodeNames.has(nodeName) || !Object.hasOwn(args.persistedPinData, nodeName))
            continue;
        nextPinData ??= { ...args.persistedPinData };
        const preservedPinData = Object.hasOwn(args.nonVerificationPinData, nodeName)
            ? args.nonVerificationPinData[nodeName]
            : undefined;
        if (preservedPinData) {
            Object.defineProperty(nextPinData, nodeName, {
                value: preservedPinData,
                enumerable: true,
                writable: true,
                configurable: true,
            });
        }
        else {
            delete nextPinData[nodeName];
        }
    }
    return nextPinData;
}
function validateInputDataShape(node, inputData) {
    if (node.type !== n8n_workflow_1.FORM_TRIGGER_NODE_TYPE)
        return;
    const formFieldsValue = inputData.formFields;
    const looksWrapped = typeof formFieldsValue === 'object' && formFieldsValue !== null;
    if (looksWrapped) {
        throw new Error('workflow_builder_verify_built_workflow: inputData for a Form Trigger must be a flat field map ' +
            '(e.g. {name: "Alice", email: "a@b.c"}), NOT wrapped in `formFields`. ' +
            'The production Form Trigger emits fields directly on $json, so downstream ' +
            'expressions like $json.name are correct. Re-run with the flat shape.');
    }
}
function toWorkflowJsonValue(value) {
    if (value === null || value === undefined)
        return value;
    switch (typeof value) {
        case 'string':
        case 'number':
        case 'boolean':
        case 'object':
            return value;
        default:
            return String(value);
    }
}
function getPinDataForTrigger(node, inputData) {
    validateInputDataShape(node, inputData);
    switch (node.type) {
        case n8n_workflow_1.CHAT_TRIGGER_NODE_TYPE:
            return {
                [node.name]: [
                    {
                        json: {
                            sessionId: `instance-ai-${Date.now()}`,
                            action: 'sendMessage',
                            chatInput: typeof inputData.chatInput === 'string'
                                ? inputData.chatInput
                                : JSON.stringify(inputData),
                        },
                    },
                ],
            };
        case n8n_workflow_1.FORM_TRIGGER_NODE_TYPE:
            return {
                [node.name]: [
                    {
                        json: {
                            submittedAt: new Date().toISOString(),
                            formMode: 'instanceAi',
                            ...inputData,
                        },
                    },
                ],
            };
        case n8n_workflow_1.WEBHOOK_NODE_TYPE: {
            const envelopeKeys = new Set(['body', 'headers', 'query', 'params']);
            const inputKeys = Object.keys(inputData);
            const looksLikeEnvelope = inputKeys.length > 0 && inputKeys.every((key) => envelopeKeys.has(key));
            const body = looksLikeEnvelope
                ? Object.hasOwn(inputData, 'body')
                    ? toWorkflowJsonValue(inputData.body)
                    : {}
                : inputData;
            const headers = looksLikeEnvelope && typeof inputData.headers === 'object' && inputData.headers !== null
                ? inputData.headers
                : {};
            const query = looksLikeEnvelope && typeof inputData.query === 'object' && inputData.query !== null
                ? inputData.query
                : {};
            const params = looksLikeEnvelope && typeof inputData.params === 'object' && inputData.params !== null
                ? inputData.params
                : {};
            return {
                [node.name]: [
                    {
                        json: { headers, query, params, body },
                    },
                ],
            };
        }
        case n8n_workflow_1.SCHEDULE_TRIGGER_NODE_TYPE: {
            const now = new Date();
            return {
                [node.name]: [
                    {
                        json: {
                            timestamp: now.toISOString(),
                            'Readable date': now.toLocaleString(),
                            'Day of week': now.toLocaleDateString('en-US', { weekday: 'long' }),
                            Year: String(now.getFullYear()),
                            Month: now.toLocaleDateString('en-US', { month: 'long' }),
                            'Day of month': String(now.getDate()).padStart(2, '0'),
                            Hour: String(now.getHours()).padStart(2, '0'),
                            Minute: String(now.getMinutes()).padStart(2, '0'),
                            Second: String(now.getSeconds()).padStart(2, '0'),
                        },
                    },
                ],
            };
        }
        default:
            return {
                [node.name]: [{ json: inputData }],
            };
    }
}
//# sourceMappingURL=instance-ai-run-pin-data.js.map