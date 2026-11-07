"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSendAndWaitPropertiesForChatNode = exports.configureInputs = void 0;
exports.configureWaitTillDate = configureWaitTillDate;
exports.getChatMessage = getChatMessage;
const utils_1 = require("n8n-nodes-base/dist/utils/sendAndWait/utils");
const n8n_workflow_1 = require("n8n-workflow");
function configureWaitTillDate(context) {
    let waitTill = n8n_workflow_1.WAIT_INDEFINITELY;
    const limitOptions = context.getNodeParameter('options.limitWaitTime.values', 0, {});
    if (Object.keys(limitOptions).length) {
        try {
            if (limitOptions.limitType === 'afterTimeInterval') {
                let waitAmount = limitOptions.resumeAmount;
                if (limitOptions.resumeUnit === 'minutes') {
                    waitAmount *= 60;
                }
                if (limitOptions.resumeUnit === 'hours') {
                    waitAmount *= 60 * 60;
                }
                if (limitOptions.resumeUnit === 'days') {
                    waitAmount *= 60 * 60 * 24;
                }
                waitAmount *= 1000;
                waitTill = new Date(new Date().getTime() + waitAmount);
            }
            else {
                waitTill = new Date(limitOptions.maxDateAndTime);
            }
            if (isNaN(waitTill.getTime())) {
                throw new n8n_workflow_1.UserError('Invalid date format');
            }
        }
        catch (error) {
            throw new n8n_workflow_1.NodeOperationError(context.getNode(), 'Could not configure Limit Wait Time', {
                description: error.message,
            });
        }
    }
    return waitTill;
}
const configureInputs = (parameters) => {
    const inputs = [
        {
            type: 'main',
        },
    ];
    if (parameters.options?.memoryConnection) {
        return [
            ...inputs,
            {
                type: 'ai_memory',
                displayName: 'Memory',
                maxConnections: 1,
            },
        ];
    }
    return inputs;
};
exports.configureInputs = configureInputs;
const freeTextResponseTypeOption = {
    name: 'Free Text',
    value: n8n_workflow_1.FREE_TEXT_CHAT_RESPONSE_TYPE,
    description: 'User can submit a response in the chat',
};
const blockUserInput = {
    displayName: 'Block User Input',
    name: 'blockUserInput',
    type: 'boolean',
    default: false,
    description: 'Whether to block input from the user while waiting for approval',
    displayOptions: {
        show: {
            responseType: ['approval'],
        },
    },
};
const getSendAndWaitPropertiesForChatNode = () => {
    const originalProperties = (0, utils_1.getSendAndWaitProperties)([], null);
    const filteredProperties = originalProperties.filter((p) => p.name !== 'subject' && p.name !== 'message' && p.name !== 'options');
    const responseTypeProperty = filteredProperties.find((p) => p.name === 'responseType');
    if (responseTypeProperty) {
        const approvalOption = responseTypeProperty.options?.find((o) => 'value' in o && o.value === 'approval');
        responseTypeProperty.options = approvalOption
            ? [
                approvalOption,
                freeTextResponseTypeOption,
            ]
            : [freeTextResponseTypeOption];
        responseTypeProperty.default = n8n_workflow_1.FREE_TEXT_CHAT_RESPONSE_TYPE;
    }
    filteredProperties.splice(1, 0, blockUserInput);
    return filteredProperties;
};
exports.getSendAndWaitPropertiesForChatNode = getSendAndWaitPropertiesForChatNode;
function getChatMessage(ctx) {
    const nodeVersion = ctx.getNode().typeVersion;
    const message = ctx.getNodeParameter('message', 0, '');
    if (nodeVersion < 1.1) {
        return message;
    }
    const responseType = ctx.getNodeParameter('responseType', 0, n8n_workflow_1.FREE_TEXT_CHAT_RESPONSE_TYPE);
    if (responseType === n8n_workflow_1.FREE_TEXT_CHAT_RESPONSE_TYPE) {
        return message;
    }
    const blockUserInput = ctx.getNodeParameter('blockUserInput', 0, false);
    const config = (0, utils_1.getSendAndWaitConfig)(ctx);
    return {
        type: n8n_workflow_1.ChatNodeMessageType.WITH_BUTTONS,
        text: message,
        blockUserInput,
        buttons: [...config.options].reverse().map((option) => ({
            text: option.label,
            link: option.url,
            type: option.style,
        })),
    };
}
//# sourceMappingURL=util.js.map