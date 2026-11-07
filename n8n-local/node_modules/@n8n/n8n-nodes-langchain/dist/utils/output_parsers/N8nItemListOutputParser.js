"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.N8nItemListOutputParser = void 0;
const output_parsers_1 = require("@langchain/core/output_parsers");
class N8nItemListOutputParser extends output_parsers_1.BaseOutputParser {
    constructor(options) {
        super();
        this.lc_namespace = ['n8n-nodes-langchain', 'output_parsers', 'list_items'];
        const { numberOfItems = 3, separator = '\n' } = options;
        if (numberOfItems && numberOfItems > 0) {
            this.numberOfItems = numberOfItems;
        }
        this.separator = separator;
        if (this.separator === '\\n') {
            this.separator = '\n';
        }
    }
    async parse(text) {
        const response = text
            .split(this.separator)
            .map((item) => item.trim())
            .filter((item) => item);
        if (this.numberOfItems && response.length < this.numberOfItems) {
            throw new output_parsers_1.OutputParserException(`Wrong number of items returned. Expected ${this.numberOfItems} items but got ${response.length} items instead.`);
        }
        return response.slice(0, this.numberOfItems);
    }
    getFormatInstructions() {
        const instructions = `Your response should be a list of ${this.numberOfItems ? this.numberOfItems + ' ' : ''}items separated by`;
        const numberOfExamples = this.numberOfItems ?? 3;
        const examples = [];
        for (let i = 1; i <= numberOfExamples; i++) {
            examples.push(`item${i}`);
        }
        return `${instructions} "${this.separator}" (for example: "${examples.join(this.separator)}")`;
    }
    getSchema() {
        return;
    }
}
exports.N8nItemListOutputParser = N8nItemListOutputParser;
//# sourceMappingURL=N8nItemListOutputParser.js.map