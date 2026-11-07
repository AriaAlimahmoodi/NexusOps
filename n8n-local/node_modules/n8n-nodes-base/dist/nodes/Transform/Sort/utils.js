"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortByCode = sortByCode;
const n8n_workflow_1 = require("n8n-workflow");
const JsTaskRunnerSandbox_1 = require("../../Code/JsTaskRunnerSandbox");
const returnRegExp = /\breturn\b/;
async function sortByCode() {
    const userCode = this.getNodeParameter('code', 0);
    if (!returnRegExp.test(userCode)) {
        throw new n8n_workflow_1.NodeOperationError(this.getNode(), "Sort code doesn't return. Please add a 'return' statement to your code");
    }
    const mode = this.getMode();
    const items = this.getInputData();
    const code = `return items.sort((a, b) => { ${userCode} })`;
    const chunkSize = undefined;
    const sandbox = new JsTaskRunnerSandbox_1.JsTaskRunnerSandbox(mode, this, chunkSize, { items });
    const executionResult = await sandbox.runCode(code);
    return executionResult;
}
//# sourceMappingURL=utils.js.map