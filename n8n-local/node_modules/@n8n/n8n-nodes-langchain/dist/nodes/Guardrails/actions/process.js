"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.process = process;
const n8n_workflow_1 = require("n8n-workflow");
const base_1 = require("../helpers/base");
const common_1 = require("../helpers/common");
const mappers_1 = require("../helpers/mappers");
const model_1 = require("../helpers/model");
const preflight_1 = require("../helpers/preflight");
const jailbreak_1 = require("./checks/jailbreak");
const keywords_1 = require("./checks/keywords");
const nsfw_1 = require("./checks/nsfw");
const pii_1 = require("./checks/pii");
const secretKeys_1 = require("./checks/secretKeys");
const topicalAlignment_1 = require("./checks/topicalAlignment");
const urls_1 = require("./checks/urls");
async function process(itemIndex, model) {
    const inputText = this.getNodeParameter('text', itemIndex);
    const operation = this.getNodeParameter('operation', 0);
    const guardrails = this.getNodeParameter('guardrails', itemIndex);
    const customizeSystemMessage = operation === 'classify' &&
        this.getNodeParameter('customizeSystemMessage', itemIndex, false);
    const systemMessage = customizeSystemMessage
        ? this.getNodeParameter('systemMessage', itemIndex)
        : undefined;
    const failedChecks = [];
    const passedChecks = [];
    const handleFailedResults = (results) => {
        const unexpectedError = results.failed.find((result) => result.status === 'rejected' ||
            (result.status === 'fulfilled' && result.value.executionFailed));
        if (results.failed.length && operation === 'sanitize') {
            throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Failed to sanitize text', {
                description: (0, mappers_1.mapGuardrailErrorsToMessage)(results.failed),
                itemIndex,
            });
        }
        if (unexpectedError && !this.continueOnFail()) {
            const error = unexpectedError.status === 'rejected'
                ? unexpectedError.reason
                : unexpectedError.value.originalException;
            throw new n8n_workflow_1.NodeOperationError(this.getNode(), error, {
                description: error?.description || error?.message,
                itemIndex,
            });
        }
        return results.failed.map(mappers_1.mapGuardrailResultToUserResult);
    };
    const stageGuardrails = {
        preflight: [],
        input: [],
    };
    const checkModelAvailable = (model) => {
        if (!model) {
            throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Chat Model is required');
        }
        return true;
    };
    if (guardrails.pii?.value) {
        const { entities } = guardrails.pii.value;
        stageGuardrails.preflight.push({
            name: 'personalData',
            check: (0, pii_1.createPiiCheckFn)({
                entities,
            }),
        });
    }
    if (guardrails.customRegex?.regex) {
        stageGuardrails.preflight.push({
            name: 'customRegex',
            check: (0, pii_1.createCustomRegexCheckFn)({
                customRegex: guardrails.customRegex.regex,
            }),
        });
    }
    if (guardrails.secretKeys?.value) {
        const { permissiveness } = guardrails.secretKeys.value;
        stageGuardrails.preflight.push({
            name: 'secretKeys',
            check: (0, secretKeys_1.createSecretKeysCheckFn)({ threshold: permissiveness }),
        });
    }
    if (guardrails.urls?.value) {
        const { allowedUrls, allowedSchemes, blockUserinfo, allowSubdomains } = guardrails.urls.value;
        stageGuardrails.preflight.push({
            name: 'urls',
            check: (0, urls_1.createUrlsCheckFn)({
                allowedUrls: (0, common_1.splitByComma)(allowedUrls),
                allowedSchemes,
                blockUserinfo,
                allowSubdomains,
            }),
        });
    }
    if (operation === 'classify') {
        if (guardrails.keywords) {
            stageGuardrails.input.push({
                name: 'keywords',
                check: (0, keywords_1.createKeywordsCheckFn)({ keywords: (0, common_1.splitByComma)(guardrails.keywords) }),
            });
        }
        if (guardrails.jailbreak?.value && checkModelAvailable(model)) {
            const { prompt, threshold } = guardrails.jailbreak.value;
            stageGuardrails.input.push({
                name: 'jailbreak',
                check: (0, jailbreak_1.createJailbreakCheckFn)({
                    model,
                    prompt: prompt?.trim() || jailbreak_1.JAILBREAK_PROMPT,
                    threshold,
                    systemMessage,
                }),
            });
        }
        if (guardrails.nsfw?.value && checkModelAvailable(model)) {
            const { prompt, threshold } = guardrails.nsfw.value;
            stageGuardrails.input.push({
                name: 'nsfw',
                check: (0, nsfw_1.createNSFWCheckFn)({
                    model,
                    prompt: prompt?.trim() || nsfw_1.NSFW_SYSTEM_PROMPT,
                    threshold,
                    systemMessage,
                }),
            });
        }
        if (guardrails.topicalAlignment?.value && checkModelAvailable(model)) {
            const { prompt, threshold } = guardrails.topicalAlignment.value;
            stageGuardrails.input.push({
                name: 'topicalAlignment',
                check: (0, topicalAlignment_1.createTopicalAlignmentCheckFn)({
                    model,
                    prompt: prompt?.trim() || topicalAlignment_1.TOPICAL_ALIGNMENT_SYSTEM_PROMPT,
                    systemMessage,
                    threshold,
                }),
            });
        }
        if (guardrails.custom?.guardrail && checkModelAvailable(model)) {
            for (const customGuardrail of guardrails.custom.guardrail) {
                const { prompt, threshold, name } = customGuardrail;
                stageGuardrails.input.push({
                    name,
                    check: (0, model_1.createLLMCheckFn)(name, {
                        model,
                        prompt,
                        threshold,
                        systemMessage,
                    }),
                });
            }
        }
    }
    const preflightResults = await (0, base_1.runStageGuardrails)({
        inputText,
        stageGuardrails,
        stage: 'preflight',
        failOnlyOnErrors: operation === 'sanitize',
    });
    if (preflightResults.failed.length > 0) {
        failedChecks.push.apply(failedChecks, handleFailedResults(preflightResults));
        return {
            guardrailsInput: inputText,
            passed: null,
            failed: {
                checks: failedChecks,
            },
        };
    }
    else {
        passedChecks.push.apply(passedChecks, preflightResults.passed.map(mappers_1.mapGuardrailResultToUserResult));
    }
    const modifiedInputText = (0, preflight_1.applyPreflightModifications)(inputText, preflightResults.passed.map((result) => result.value));
    const inputResults = await (0, base_1.runStageGuardrails)({
        inputText: modifiedInputText,
        stageGuardrails,
        stage: 'input',
        failOnlyOnErrors: operation === 'sanitize',
    });
    if (inputResults.failed.length > 0) {
        failedChecks.push.apply(failedChecks, handleFailedResults(inputResults));
        return {
            guardrailsInput: modifiedInputText,
            passed: null,
            failed: {
                checks: failedChecks,
            },
        };
    }
    else {
        passedChecks.push.apply(passedChecks, inputResults.passed.map(mappers_1.mapGuardrailResultToUserResult));
    }
    return {
        guardrailsInput: modifiedInputText,
        passed: {
            checks: passedChecks,
        },
        failed: null,
    };
}
//# sourceMappingURL=process.js.map