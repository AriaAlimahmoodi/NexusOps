"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startTypingIndicator = startTypingIndicator;
const TYPING_MAX_LIFETIME_MS = 10 * 60 * 1000;
function startTypingIndicator(thread, options) {
    let failedStreak = false;
    let inFlight = null;
    const sendTyping = () => {
        if (inFlight)
            return;
        inFlight = thread
            .startTyping()
            .then(() => {
            failedStreak = false;
        })
            .catch((error) => {
            const log = failedStreak ? options.logger.debug : options.logger.warn;
            failedStreak = true;
            log.call(options.logger, `[AgentChatBridge] Failed to send ${options.platform} typing indicator`, {
                agentId: options.agentId,
                threadId: thread.id,
                error: error instanceof Error ? error.message : String(error),
            });
        })
            .finally(() => {
            inFlight = null;
        });
    };
    sendTyping();
    const interval = setInterval(sendTyping, options.refreshMs);
    interval.unref();
    const maxLifetime = setTimeout(() => clearInterval(interval), TYPING_MAX_LIFETIME_MS);
    maxLifetime.unref();
    return {
        clearBeforeResponse: async () => {
            clearInterval(interval);
            clearTimeout(maxLifetime);
            await inFlight;
        },
    };
}
//# sourceMappingURL=typing-indicator.js.map