"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = execute;
const process_1 = require("./process");
const configureNodeInputs_1 = require("../helpers/configureNodeInputs");
const model_1 = require("../helpers/model");
async function execute() {
    const items = this.getInputData();
    const operation = this.getNodeParameter('operation', 0);
    const model = (0, configureNodeInputs_1.hasLLMGuardrails)(this.getNodeParameter('guardrails', 0))
        ? await model_1.getChatModel.call(this)
        : null;
    const failedItems = [];
    const passedItems = [];
    for (let i = 0; i < items.length; i++) {
        try {
            const responseData = await process_1.process.call(this, i, model);
            if (responseData.passed) {
                passedItems.push({
                    json: { guardrailsInput: responseData.guardrailsInput, ...responseData.passed },
                    pairedItem: { item: i },
                });
            }
            if (responseData.failed) {
                failedItems.push({
                    json: { guardrailsInput: responseData.guardrailsInput, ...responseData.failed },
                    pairedItem: { item: i },
                });
            }
        }
        catch (error) {
            if (this.continueOnFail()) {
                failedItems.push({
                    json: { error: error.message, guardrailsInput: '' },
                    pairedItem: { item: i },
                });
            }
            else {
                throw error;
            }
        }
    }
    if (operation === 'classify') {
        return [passedItems, failedItems];
    }
    return [passedItems];
}
//# sourceMappingURL=execute.js.map