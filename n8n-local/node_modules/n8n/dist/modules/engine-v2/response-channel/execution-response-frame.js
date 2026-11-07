"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeExecutionResponse = serializeExecutionResponse;
exports.deserializeExecutionResponse = deserializeExecutionResponse;
const engine_1 = require("@n8n/engine");
const result_1 = require("@n8n/utils/result");
const n8n_workflow_1 = require("n8n-workflow");
const MAX_FRAME_BYTES = 5 * 1024 * 1024;
function serializeExecutionResponse(response, logger, maxFrameBytes = MAX_FRAME_BYTES) {
    const serialized = (0, result_1.toResult)(() => JSON.stringify(response));
    if (!serialized.ok) {
        logger.warn('Could not serialize an execution response', {
            executionId: response.executionId,
            type: response.type,
            error: serialized.error,
        });
        return undeliverableFrame(response.executionId, {
            code: 'RESPONSE_SERIALIZATION_FAILED',
            message: 'The execution response could not be serialized.',
        });
    }
    if (Buffer.byteLength(serialized.result) > maxFrameBytes) {
        logger.warn('Execution response exceeds the frame size limit', {
            executionId: response.executionId,
            type: response.type,
        });
        return undeliverableFrame(response.executionId, {
            code: 'RESPONSE_TOO_LARGE',
            message: `The execution response exceeds the maximum size of ${maxFrameBytes} bytes.`,
        });
    }
    return { ok: true, frame: serialized.result };
}
function deserializeExecutionResponse(frame, logger) {
    const deserialized = (0, result_1.toResult)(() => JSON.parse(frame));
    if (!deserialized.ok) {
        logger.error('Discarding an unreadable execution response', { error: deserialized.error });
        return deserialized;
    }
    const parsed = engine_1.executionResponseSchema.safeParse(deserialized.result);
    if (!parsed.success) {
        logger.error('Discarding a malformed execution response', {
            details: parsed.error.flatten(),
        });
        return (0, result_1.createResultError)(parsed.error);
    }
    return (0, result_1.createResultOk)(parsed.data);
}
function undeliverableFrame(executionId, error) {
    const frame = JSON.stringify({
        type: 'undeliverable',
        executionId,
        error,
    });
    return {
        ok: false,
        frame,
        error: new n8n_workflow_1.UnexpectedError(error.message, { extra: { code: error.code } }),
    };
}
//# sourceMappingURL=execution-response-frame.js.map