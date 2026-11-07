"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerProtectedResourceResolvers = registerProtectedResourceResolvers;
const di_1 = require("@n8n/di");
const auth_1 = require("@n8n/backend-services/auth");
const chat_trigger_resource_resolver_1 = require("./chat-trigger-resource.resolver");
const chat_trigger_test_resource_resolver_1 = require("./chat-trigger-test-resource.resolver");
const form_trigger_test_resource_resolver_1 = require("./form-trigger-test-resource.resolver");
const form_trigger_resource_resolver_1 = require("./form-trigger-resource.resolver");
const workflow_mcp_test_trigger_resource_resolver_1 = require("./workflow-mcp-test-trigger-resource.resolver");
const workflow_mcp_trigger_resource_resolver_1 = require("./workflow-mcp-trigger-resource.resolver");
const workflow_webhook_test_trigger_resource_resolver_1 = require("./workflow-webhook-test-trigger-resource.resolver");
const workflow_webhook_trigger_resource_resolver_1 = require("./workflow-webhook-trigger-resource.resolver");
function registerProtectedResourceResolvers() {
    di_1.Container.get(auth_1.ProtectedResourceRegistry).registerResolver(di_1.Container.get(workflow_mcp_trigger_resource_resolver_1.WorkflowMcpTriggerResourceResolver));
    di_1.Container.get(auth_1.ProtectedResourceRegistry).registerResolver(di_1.Container.get(workflow_mcp_test_trigger_resource_resolver_1.WorkflowMcpTestTriggerResourceResolver));
    di_1.Container.get(auth_1.ProtectedResourceRegistry).registerResolver(di_1.Container.get(form_trigger_resource_resolver_1.FormTriggerResourceResolver));
    di_1.Container.get(auth_1.ProtectedResourceRegistry).registerResolver(di_1.Container.get(form_trigger_test_resource_resolver_1.FormTriggerTestResourceResolver));
    di_1.Container.get(auth_1.ProtectedResourceRegistry).registerResolver(di_1.Container.get(chat_trigger_resource_resolver_1.ChatTriggerResourceResolver));
    di_1.Container.get(auth_1.ProtectedResourceRegistry).registerResolver(di_1.Container.get(chat_trigger_test_resource_resolver_1.ChatTriggerTestResourceResolver));
    di_1.Container.get(auth_1.ProtectedResourceRegistry).registerResolver(di_1.Container.get(workflow_webhook_trigger_resource_resolver_1.WorkflowWebhookTriggerResourceResolver));
    di_1.Container.get(auth_1.ProtectedResourceRegistry).registerResolver(di_1.Container.get(workflow_webhook_test_trigger_resource_resolver_1.WorkflowWebhookTestTriggerResourceResolver));
}
//# sourceMappingURL=index.js.map