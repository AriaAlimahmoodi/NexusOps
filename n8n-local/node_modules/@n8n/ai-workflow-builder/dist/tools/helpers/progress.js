"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProgressReporter = createProgressReporter;
exports.reportStart = reportStart;
exports.reportProgress = reportProgress;
exports.reportComplete = reportComplete;
exports.reportError = reportError;
exports.createBatchProgressReporter = createBatchProgressReporter;
function createProgressReporter(config, toolName, displayTitle, customTitle) {
    const toolCallId = config.toolCall?.id;
    let customDisplayTitle = customTitle;
    const emit = (message) => {
        config.writer?.(message);
    };
    const start = (input, options) => {
        if (options?.customDisplayTitle) {
            customDisplayTitle = options.customDisplayTitle;
        }
        emit({
            type: 'tool',
            toolName,
            toolCallId,
            displayTitle,
            customDisplayTitle,
            status: 'running',
            updates: [
                {
                    type: 'input',
                    data: input,
                },
            ],
        });
    };
    const progress = (message, data) => {
        emit({
            type: 'tool',
            toolName,
            toolCallId,
            displayTitle,
            customDisplayTitle,
            status: 'running',
            updates: [
                {
                    type: 'progress',
                    data: data ?? { message },
                },
            ],
        });
    };
    const complete = (output) => {
        emit({
            type: 'tool',
            toolName,
            toolCallId,
            displayTitle,
            customDisplayTitle,
            status: 'completed',
            updates: [
                {
                    type: 'output',
                    data: output,
                },
            ],
        });
    };
    const error = (error) => {
        emit({
            type: 'tool',
            toolName,
            toolCallId,
            displayTitle,
            customDisplayTitle,
            status: 'error',
            updates: [
                {
                    type: 'error',
                    data: {
                        message: error.message,
                        code: error.code,
                        details: error.details,
                    },
                },
            ],
        });
    };
    const createBatchReporter = (scope) => {
        let currentIndex = 0;
        let totalItems = 0;
        return {
            init: (total) => {
                totalItems = total;
                currentIndex = 0;
            },
            next: (itemDescription) => {
                currentIndex++;
                progress(`${scope}: Processing item ${currentIndex} of ${totalItems}: ${itemDescription}`);
            },
            complete: () => {
                progress(`${scope}: Completed all ${totalItems} items`);
            },
        };
    };
    const setCustomTitle = (title) => {
        customDisplayTitle = title;
    };
    return {
        start,
        progress,
        complete,
        error,
        setCustomTitle,
        createBatchReporter,
    };
}
function reportStart(reporter, input) {
    reporter.start(input);
}
function reportProgress(reporter, message, data) {
    reporter.progress(message, data);
}
function reportComplete(reporter, output) {
    reporter.complete(output);
}
function reportError(reporter, error) {
    reporter.error(error);
}
function createBatchProgressReporter(reporter, scope) {
    return reporter.createBatchReporter(scope);
}
//# sourceMappingURL=progress.js.map