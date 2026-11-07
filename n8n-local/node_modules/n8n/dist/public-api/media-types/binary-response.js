"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendBinaryResponse = sendBinaryResponse;
const errors_1 = require("@n8n/errors");
const node_stream_1 = require("node:stream");
const promises_1 = require("node:stream/promises");
function isBinaryResult(result) {
    return (typeof result === 'object' &&
        result !== null &&
        'body' in result &&
        (Buffer.isBuffer(result.body) || result.body instanceof node_stream_1.Readable));
}
function isClientGone(error) {
    return (error instanceof Error &&
        'code' in error &&
        (error.code === 'ERR_STREAM_PREMATURE_CLOSE' || error.code === 'ERR_STREAM_UNABLE_TO_PIPE'));
}
function setResponseHeaders(res, successStatus, mediaType, headers) {
    for (const [name, value] of Object.entries(headers)) {
        res.setHeader(name, value);
    }
    res.status(successStatus).setHeader('Content-Type', mediaType);
}
async function sendStream(res, body, setHeaders) {
    const release = () => body.destroy();
    res.once('close', release);
    if (res.destroyed) {
        release();
    }
    try {
        const iterator = body[Symbol.asyncIterator]();
        const first = await iterator.next();
        setHeaders();
        const rest = { [Symbol.asyncIterator]: () => iterator };
        async function* withFirstChunk() {
            if (!first.done) {
                yield first.value;
            }
            yield* rest;
        }
        await (0, promises_1.pipeline)(node_stream_1.Readable.from(withFirstChunk()), res);
    }
    catch (error) {
        if (!isClientGone(error)) {
            throw error;
        }
    }
    finally {
        res.off('close', release);
    }
}
async function sendBinaryResponse(res, binaryResponse, successStatus, routeName, result) {
    if (!isBinaryResult(result)) {
        throw new errors_1.UnexpectedError(`${routeName} declares a binary @ApiResponse but returned no body`);
    }
    const { body } = result;
    const declaredHeaders = binaryResponse.headers ?? {};
    const resultHeaders = result.headers ?? {};
    try {
        const setHeaderNames = new Set(Object.keys(resultHeaders).map((name) => name.toLowerCase()));
        const missing = Object.keys(declaredHeaders).filter((name) => !setHeaderNames.has(name.toLowerCase()));
        if (missing.length) {
            throw new errors_1.UnexpectedError(`${routeName} did not set the declared response header(s): ${missing.join(', ')}`);
        }
        const setHeaders = () => setResponseHeaders(res, successStatus, binaryResponse.mediaType, resultHeaders);
        if (Buffer.isBuffer(body)) {
            setHeaders();
            res.end(body);
            return;
        }
        await sendStream(res, body, setHeaders);
    }
    finally {
        if (body instanceof node_stream_1.Readable) {
            body.destroy();
        }
    }
}
//# sourceMappingURL=binary-response.js.map