"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAttributionTracker = createAttributionTracker;
function createAttributionTracker(attributions) {
    const pending = new Set();
    let text = '';
    return {
        observe(chunk) {
            if (attributions.size === 0)
                return [];
            if (chunk.type === 'text-delta')
                text += chunk.delta;
            if (chunk.type === 'tool-result' && !chunk.isError && !chunk.canceled) {
                const attribution = chunk.mcpServerName !== undefined ? attributions.get(chunk.mcpServerName) : undefined;
                if (attribution !== undefined)
                    pending.add(attribution);
            }
            if (chunk.type !== 'finish')
                return [];
            if (chunk.finishReason === 'error' || chunk.finishReason === 'tool-calls')
                return [];
            if (text.trim() === '')
                return [];
            const lines = [...pending].filter((attribution) => !text.includes(attribution));
            if (lines.length === 0)
                return [];
            const id = crypto.randomUUID();
            return [
                { type: 'text-start', id },
                { type: 'text-delta', id, delta: `\n\n${lines.join('\n')}` },
                { type: 'text-end', id },
            ];
        },
    };
}
//# sourceMappingURL=mcp-attribution.js.map