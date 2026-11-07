"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeTool = executeTool;
const convertToSchema_1 = require("./convertToSchema");
async function executeTool(tool, query) {
    let convertedQuery = query;
    if ('schema' in tool && tool.schema) {
        convertedQuery = (0, convertToSchema_1.convertObjectBySchema)(query, tool.schema);
    }
    const result = await tool.invoke(convertedQuery);
    return {
        json: result,
    };
}
//# sourceMappingURL=executeTool.js.map