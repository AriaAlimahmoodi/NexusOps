"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolWorkflowV2 = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const methods_1 = require("./methods");
const WorkflowToolService_1 = require("./utils/WorkflowToolService");
const versionDescription_1 = require("./versionDescription");
async function getTool(ctx, enableLogging, itemIndex) {
    const node = ctx.getNode();
    const { typeVersion } = node;
    const returnAllItems = typeVersion > 2;
    const workflowToolService = new WorkflowToolService_1.WorkflowToolService(ctx, { returnAllItems });
    const name = typeVersion <= 2.1 ? ctx.getNodeParameter('name', 0) : (0, n8n_workflow_1.nodeNameToToolName)(node);
    const description = ctx.getNodeParameter('description', 0);
    return await workflowToolService.createTool({
        ctx,
        name,
        description,
        itemIndex,
        manualLogging: enableLogging,
    });
}
class ToolWorkflowV2 {
    constructor(baseDescription) {
        this.methods = {
            localResourceMapping: methods_1.localResourceMapping,
        };
        this.description = {
            ...baseDescription,
            ...versionDescription_1.versionDescription,
        };
    }
    async supplyData(itemIndex) {
        return { response: await getTool(this, true, itemIndex) };
    }
    async execute() {
        const items = this.getInputData();
        const response = [];
        for (let itemIndex = 0; itemIndex < this.getInputData().length; itemIndex++) {
            const item = items[itemIndex];
            const tool = await getTool(this, false, itemIndex);
            if (item === undefined) {
                continue;
            }
            try {
                const result = await tool.invoke(item.json);
                if (Array.isArray(result)) {
                    response.push(...result);
                }
                else {
                    response.push({
                        json: { response: result },
                        pairedItem: { item: itemIndex },
                    });
                }
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), errorMessage, { itemIndex });
            }
        }
        return [response];
    }
}
exports.ToolWorkflowV2 = ToolWorkflowV2;
//# sourceMappingURL=ToolWorkflowV2.node.js.map