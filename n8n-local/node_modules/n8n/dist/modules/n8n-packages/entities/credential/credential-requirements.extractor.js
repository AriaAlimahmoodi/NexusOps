"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CredentialRequirementsExtractor = void 0;
const di_1 = require("@n8n/di");
const extract_agent_credential_ids_1 = require("../../../../modules/agents/utils/extract-agent-credential-ids");
const workflow_credential_references_1 = require("./workflow-credential-references");
let CredentialRequirementsExtractor = class CredentialRequirementsExtractor {
    extractFromWorkflow(workflow) {
        const byId = new Map();
        (0, workflow_credential_references_1.visitWorkflowCredentials)(workflow.nodes, (credentialType, details) => {
            if (!details.id || byId.has(details.id))
                return false;
            byId.set(details.id, {
                workflowId: workflow.id,
                credentialId: details.id,
                credentialName: details.name,
                credentialType,
            });
            return false;
        });
        return [...byId.values()];
    }
    extractFromAgent(config) {
        const credentials = new Map([...(0, extract_agent_credential_ids_1.extractAgentCredentialIds)(config)].map((id) => [id, { credentialId: id }]));
        const nodeCredentials = (config?.tools ?? [])
            .filter((tool) => tool.type === 'node')
            .flatMap(({ node }) => Object.entries(node.credentials ?? {}));
        for (const [type, details] of nodeCredentials) {
            const credential = details.id === null ? undefined : credentials.get(details.id);
            if (!credential)
                continue;
            if (details.name)
                credential.credentialName ??= details.name;
            if (type)
                credential.credentialType ??= type;
        }
        return [...credentials.values()];
    }
};
exports.CredentialRequirementsExtractor = CredentialRequirementsExtractor;
exports.CredentialRequirementsExtractor = CredentialRequirementsExtractor = __decorate([
    (0, di_1.Service)()
], CredentialRequirementsExtractor);
//# sourceMappingURL=credential-requirements.extractor.js.map