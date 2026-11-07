"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.N8nStructuredOutputParser = exports.N8nItemListOutputParser = exports.N8nOutputFixingParser = void 0;
exports.getOptionalOutputParser = getOptionalOutputParser;
const n8n_workflow_1 = require("n8n-workflow");
const N8nItemListOutputParser_1 = require("./N8nItemListOutputParser");
Object.defineProperty(exports, "N8nItemListOutputParser", { enumerable: true, get: function () { return N8nItemListOutputParser_1.N8nItemListOutputParser; } });
const N8nOutputFixingParser_1 = require("./N8nOutputFixingParser");
Object.defineProperty(exports, "N8nOutputFixingParser", { enumerable: true, get: function () { return N8nOutputFixingParser_1.N8nOutputFixingParser; } });
const N8nStructuredOutputParser_1 = require("./N8nStructuredOutputParser");
Object.defineProperty(exports, "N8nStructuredOutputParser", { enumerable: true, get: function () { return N8nStructuredOutputParser_1.N8nStructuredOutputParser; } });
async function getOptionalOutputParser(ctx, index = 0) {
    let outputParser;
    if (ctx.getNodeParameter('hasOutputParser', 0, true) === true) {
        outputParser = (await ctx.getInputConnectionData(n8n_workflow_1.NodeConnectionTypes.AiOutputParser, index));
    }
    return outputParser;
}
//# sourceMappingURL=N8nOutputParser.js.map