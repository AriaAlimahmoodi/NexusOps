"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordAdapterCalls = recordAdapterCalls;
const channel_integration_recorder_1 = require("./channel-integration-recorder");
const METHODS_BY_PLATFORM = {
    slack: [
        'postMessage',
        'editMessage',
        'deleteMessage',
        'addReaction',
        'removeReaction',
        'startTyping',
        'stream',
        'openDM',
        'fetchMessages',
    ],
    telegram: [
        'postMessage',
        'editMessage',
        'deleteMessage',
        'addReaction',
        'removeReaction',
        'startTyping',
        'openDM',
        'fetchMessages',
    ],
    linear: ['postMessage', 'editMessage', 'deleteMessage', 'addReaction', 'fetchMessages'],
    discord: [
        'postMessage',
        'postChannelMessage',
        'editMessage',
        'deleteMessage',
        'addReaction',
        'removeReaction',
        'startTyping',
        'openDM',
        'fetchMessages',
    ],
};
function isObject(value) {
    return typeof value === 'object' && value !== null;
}
function isAsyncIterable(value) {
    return isObject(value) && Symbol.asyncIterator in value;
}
function wrapStreamArg(args) {
    const [threadId, textStream, ...rest] = args;
    if (!isAsyncIterable(textStream)) {
        return { args, getChunks: () => [] };
    }
    const chunks = [];
    const wrappedStream = {
        [Symbol.asyncIterator]: () => {
            const iterator = textStream[Symbol.asyncIterator]();
            return {
                async next() {
                    const result = await iterator.next();
                    if (!result.done)
                        chunks.push(result.value);
                    return result;
                },
            };
        },
    };
    return {
        args: [threadId, wrappedStream, ...rest],
        getChunks: () => chunks,
    };
}
function recordAdapterCalls(platform, adapter, recorder = channel_integration_recorder_1.channelIntegrationRecorder, methodsToRecord = METHODS_BY_PLATFORM[platform] ?? []) {
    if (!isObject(adapter))
        return adapter;
    if (!recorder.isEnabled || methodsToRecord.length === 0)
        return adapter;
    return new Proxy(adapter, {
        get(target, prop, receiver) {
            const value = Reflect.get(target, prop, receiver);
            if (typeof prop !== 'string' ||
                typeof value !== 'function' ||
                !methodsToRecord.includes(prop)) {
                return value;
            }
            const method = value;
            return async (...args) => {
                const streamRecording = prop === 'stream' ? wrapStreamArg(args) : undefined;
                const callArgs = streamRecording?.args ?? args;
                let response;
                let error;
                try {
                    response = await method.apply(target, callArgs);
                    return response;
                }
                catch (caught) {
                    error = caught instanceof Error ? caught : new Error(String(caught));
                    throw caught;
                }
                finally {
                    const recordedArgs = streamRecording === undefined
                        ? args
                        : [args[0], { streamChunks: streamRecording.getChunks() }, ...args.slice(2)];
                    await recorder
                        .recordApiCall(platform, prop, recordedArgs, response, error)
                        .catch(() => { });
                }
            };
        },
    });
}
//# sourceMappingURL=recording-adapter.js.map