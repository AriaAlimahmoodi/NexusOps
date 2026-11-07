"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.describeStructuredOutputError = describeStructuredOutputError;
function describeStructuredOutputError(rawError) {
    const haystack = rawError.toLowerCase();
    const signals = [
        'no object generated',
        'no output generated',
        'did not match schema',
        'could not parse the response',
        'response_format',
        'json_schema',
        'output_config',
        'additionalproperties',
        'invalid schema',
        'structured output',
        'does not support',
    ];
    if (!signals.some((signal) => haystack.includes(signal)))
        return null;
    const message = "Couldn't get structured output matching the schema — the model may not support it.";
    const informativeSignals = [
        'additionalproperties',
        'response_format',
        'json_schema',
        'output_config',
        'invalid schema',
        'does not support',
        'required',
    ];
    const hasUsefulDetail = informativeSignals.some((signal) => haystack.includes(signal));
    return hasUsefulDetail ? `${message} (${rawError})` : message;
}
//# sourceMappingURL=structured-output-error.js.map