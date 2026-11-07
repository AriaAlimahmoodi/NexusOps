"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenTextSplitter = void 0;
const textsplitters_1 = require("@langchain/textsplitters");
const ai_utilities_1 = require("@n8n/ai-utilities");
class TokenTextSplitter extends textsplitters_1.TextSplitter {
    static lc_name() {
        return 'TokenTextSplitter';
    }
    constructor(fields) {
        super(fields);
        this.encodingName = fields?.encodingName ?? 'cl100k_base';
        this.allowedSpecial = fields?.allowedSpecial ?? [];
        this.disallowedSpecial = fields?.disallowedSpecial ?? 'all';
    }
    async splitText(text) {
        try {
            if (!text || typeof text !== 'string') {
                return [];
            }
            if ((0, ai_utilities_1.hasLongSequentialRepeat)(text)) {
                const splits = (0, ai_utilities_1.estimateTextSplitsByTokens)(text, this.chunkSize, this.chunkOverlap, this.encodingName);
                return splits;
            }
            try {
                this.tokenizer ??= await (0, ai_utilities_1.getEncoding)(this.encodingName);
                const splits = [];
                const input_ids = this.tokenizer.encode(text, this.allowedSpecial, this.disallowedSpecial);
                let start_idx = 0;
                let chunkCount = 0;
                while (start_idx < input_ids.length) {
                    if (start_idx > 0) {
                        start_idx = Math.max(0, start_idx - this.chunkOverlap);
                    }
                    const end_idx = Math.min(start_idx + this.chunkSize, input_ids.length);
                    const chunk_ids = input_ids.slice(start_idx, end_idx);
                    splits.push(this.tokenizer.decode(chunk_ids));
                    chunkCount++;
                    start_idx = end_idx;
                }
                return splits;
            }
            catch (tiktokenError) {
                return (0, ai_utilities_1.estimateTextSplitsByTokens)(text, this.chunkSize, this.chunkOverlap, this.encodingName);
            }
        }
        catch (error) {
            return [];
        }
    }
}
exports.TokenTextSplitter = TokenTextSplitter;
//# sourceMappingURL=TokenTextSplitter.js.map