"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamAgentChunks = streamAgentChunks;
async function* streamAgentChunks(stream) {
    const reader = stream.getReader();
    let streamDone = false;
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                streamDone = true;
                break;
            }
            yield value;
        }
    }
    finally {
        try {
            if (!streamDone)
                await reader.cancel();
        }
        finally {
            reader.releaseLock();
        }
    }
}
//# sourceMappingURL=agent-stream.js.map