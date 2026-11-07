"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookExecutionContext = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class WebhookExecutionContext {
    constructor(workflow, workflowStartNode, webhookData, executionMode, additionalKeys) {
        this.workflow = workflow;
        this.workflowStartNode = workflowStartNode;
        this.webhookData = webhookData;
        this.executionMode = executionMode;
        this.additionalKeys = additionalKeys;
    }
    evaluateSimpleWebhookDescriptionExpression(propertyName, executeData, defaultValue) {
        const native = this.resolveNatively(propertyName);
        if (native.resolved)
            return native.value;
        return this.workflow.expression.getSimpleParameterValue(this.workflowStartNode, this.webhookData.webhookDescription[propertyName], this.executionMode, this.additionalKeys, executeData, defaultValue);
    }
    evaluateComplexWebhookDescriptionExpression(propertyName, executeData, defaultValue) {
        const native = this.resolveNatively(propertyName);
        if (native.resolved)
            return native.value;
        return this.workflow.expression.getComplexParameterValue(this.workflowStartNode, this.webhookData.webhookDescription[propertyName], this.executionMode, this.additionalKeys, executeData, defaultValue);
    }
    resolveNatively(propertyName) {
        return (0, n8n_workflow_1.resolveWebhookDescriptionField)(this.workflowStartNode, this.webhookData.webhookDescription, String(propertyName));
    }
}
exports.WebhookExecutionContext = WebhookExecutionContext;
//# sourceMappingURL=webhook-execution-context.js.map