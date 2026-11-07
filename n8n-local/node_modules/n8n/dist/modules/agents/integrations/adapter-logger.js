"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdapterLogger = createAdapterLogger;
function createAdapterLogger(logger, prefix) {
    const forward = (level) => (message, ..._args) => {
        logger[level](`${prefix} ${message}`);
    };
    const chatLogger = {
        child: () => chatLogger,
        debug: forward('debug'),
        info: forward('info'),
        warn: forward('warn'),
        error: forward('error'),
    };
    return chatLogger;
}
//# sourceMappingURL=adapter-logger.js.map