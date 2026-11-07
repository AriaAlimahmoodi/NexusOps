"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadSubWorkflowInputs = loadSubWorkflowInputs;
const GenericFunctions_1 = require("n8n-nodes-base/dist/utils/workflowInputsResourceMapping/GenericFunctions");
async function loadSubWorkflowInputs() {
    const { fields, subworkflowInfo, dataMode } = await GenericFunctions_1.loadWorkflowInputMappings.bind(this)();
    let emptyFieldsNotice;
    if (fields.length === 0) {
        const { triggerId, workflowId } = subworkflowInfo ?? {};
        const path = (workflowId ?? '') + (triggerId ? `/${triggerId.slice(0, 6)}` : '');
        const subworkflowLink = workflowId
            ? `<a href="/workflow/${path}" target="_blank">sub-workflow’s trigger</a>`
            : 'sub-workflow’s trigger';
        switch (dataMode) {
            case 'passthrough':
                emptyFieldsNotice = `This sub-workflow is set up to receive all input data, without specific inputs the Agent will not be able to pass data to this tool. You can define specific inputs in the ${subworkflowLink}.`;
                break;
            default:
                emptyFieldsNotice = `This sub-workflow will not receive any input when called by your AI node. Define your expected input in the ${subworkflowLink}.`;
                break;
        }
    }
    return { fields, emptyFieldsNotice };
}
//# sourceMappingURL=localResourceMapping.js.map