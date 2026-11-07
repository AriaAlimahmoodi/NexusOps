"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.interceptResponseWrites = interceptResponseWrites;
exports.createStructuredChunkAggregator = createStructuredChunkAggregator;
const uuid_1 = require("uuid");
function interceptResponseWrites(res, transform) {
    const originalWrite = res.write.bind(res);
    const originalEnd = res.end.bind(res);
    const defaultEncoding = 'utf8';
    let writeChain = Promise.resolve();
    const toText = (data, enc) => Buffer.isBuffer(data) ? data.toString(enc ?? defaultEncoding) : String(data);
    function write(chunk, encodingOrCallback, callbackFn) {
        const inputText = toText(chunk, typeof encodingOrCallback === 'string' ? encodingOrCallback : undefined);
        writeChain = writeChain
            .then(async () => await transform(inputText))
            .then((outputText) => {
            if (!encodingOrCallback) {
                originalWrite(outputText);
            }
            else if (typeof encodingOrCallback === 'function') {
                originalWrite(outputText, encodingOrCallback);
            }
            else {
                originalWrite(outputText, encodingOrCallback, callbackFn);
            }
        })
            .catch((error) => {
            const originalCb = typeof encodingOrCallback === 'function' ? encodingOrCallback : callbackFn;
            if (originalCb) {
                originalCb(error);
            }
        });
        return true;
    }
    function end(chunkOrCallback, encodingOrCallback, callbackFn) {
        void writeChain.then(() => {
            if (!chunkOrCallback) {
                originalEnd();
            }
            else if (typeof chunkOrCallback === 'function') {
                originalEnd(chunkOrCallback);
            }
            else if (!encodingOrCallback) {
                originalEnd(chunkOrCallback);
            }
            else if (typeof encodingOrCallback === 'function') {
                originalEnd(chunkOrCallback, encodingOrCallback);
            }
            else {
                originalEnd(chunkOrCallback, encodingOrCallback, callbackFn);
            }
        });
        return res;
    }
    res.write = write;
    res.end = end;
    return res;
}
const keyOf = (m) => `${m.nodeId}|${m.runIndex}|${m.itemIndex}`;
function createStructuredChunkAggregator(initialPreviousMessageId, retryOfMessageId, handlers = {}) {
    const { onBegin, onItem, onEnd, onError, onCancel } = handlers;
    const activeByKey = new Map();
    let cancelled = false;
    let previousMessageId = initialPreviousMessageId;
    const startNew = async () => {
        const message = {
            id: (0, uuid_1.v4)(),
            previousMessageId,
            retryOfMessageId: retryOfMessageId && previousMessageId === initialPreviousMessageId
                ? retryOfMessageId
                : null,
            content: '',
            createdAt: new Date(),
            updatedAt: new Date(),
            status: 'running',
        };
        previousMessageId = message.id;
        await onBegin?.(message);
        return message;
    };
    const ensureMessage = async (key) => {
        let message = activeByKey.get(key);
        if (!message) {
            message = await startNew();
            activeByKey.set(key, message);
        }
        return message;
    };
    const ingest = async (chunk) => {
        if (cancelled) {
            return null;
        }
        if (chunk.type === 'keepalive') {
            return null;
        }
        const { type, content, metadata } = chunk;
        const key = keyOf(metadata);
        if (type === 'begin') {
            if (activeByKey.has(key)) {
                throw new Error(`Duplicate begin for key ${key}`);
            }
            const message = await startNew();
            activeByKey.set(key, message);
            return message;
        }
        if (type === 'item') {
            const message = await ensureMessage(key);
            if (typeof content === 'string' && content.length) {
                message.content += content;
                await onItem?.(message, content);
            }
            return message;
        }
        if (type === 'end') {
            const message = await ensureMessage(key);
            message.status = 'success';
            message.updatedAt = new Date();
            activeByKey.delete(key);
            await onEnd?.(message);
            return message;
        }
        const message = await ensureMessage(key);
        message.status = 'error';
        message.updatedAt = new Date();
        if (typeof content === 'string') {
            message.content = (message.content ? message.content + '\n\n' : '') + content;
        }
        activeByKey.delete(key);
        await onError?.(message, content);
        return message;
    };
    const cancelAll = async () => {
        cancelled = true;
        const messages = Array.from(activeByKey.values());
        activeByKey.clear();
        for (const message of messages) {
            message.status = 'cancelled';
            message.updatedAt = new Date();
            await onCancel?.(message);
        }
    };
    return { ingest, cancelAll };
}
//# sourceMappingURL=stream-capturer.js.map