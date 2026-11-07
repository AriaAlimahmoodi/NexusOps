"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openAiFunctionsAgentExecute = openAiFunctionsAgentExecute;
const execute_1 = require("../ToolsAgent/V1/execute");
async function openAiFunctionsAgentExecute(_nodeVersion) {
    return await execute_1.toolsAgentExecute.call(this);
}
//# sourceMappingURL=execute.js.map