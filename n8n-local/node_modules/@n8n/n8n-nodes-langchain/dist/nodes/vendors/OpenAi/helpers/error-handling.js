"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openAiFailedAttemptHandler = void 0;
exports.getCustomErrorMessage = getCustomErrorMessage;
exports.isOpenAiError = isOpenAiError;
const n8n_workflow_1 = require("n8n-workflow");
const openai_1 = require("openai");
const error_1 = require("openai/error");
const errorMap = {
    insufficient_quota: 'Insufficient quota detected. <a href="https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-langchain.openai/common-issues/#insufficient-quota" target="_blank">Learn more</a> about resolving this issue',
    rate_limit_exceeded: 'OpenAI: Rate limit reached',
};
function getCustomErrorMessage(errorCode) {
    return errorMap[errorCode];
}
function isOpenAiError(error) {
    return error instanceof error_1.OpenAIError;
}
function isNonChatModelError(error) {
    if (typeof error !== 'object' || error === null) {
        return false;
    }
    return ('status' in error &&
        error.status === 404 &&
        'type' in error &&
        error.type === 'invalid_request_error' &&
        'param' in error &&
        error.param === 'model' &&
        'message' in error &&
        typeof error.message === 'string' &&
        error.message.includes('not a chat model'));
}
const openAiFailedAttemptHandler = (error) => {
    if (isNonChatModelError(error)) {
        throw new n8n_workflow_1.OperationalError('This model requires the Responses API. Enable "Use Responses API" in the OpenAI Chat Model node options to use this model.', { cause: error });
    }
    if (error instanceof openai_1.RateLimitError) {
        const errorCode = error?.code;
        const errorMessage = getCustomErrorMessage(errorCode ?? 'rate_limit_exceeded') ?? errorMap.rate_limit_exceeded;
        throw new n8n_workflow_1.OperationalError(errorMessage, { cause: error });
    }
};
exports.openAiFailedAttemptHandler = openAiFailedAttemptHandler;
//# sourceMappingURL=error-handling.js.map