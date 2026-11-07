"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentRequirementsExtractor = void 0;
const di_1 = require("@n8n/di");
const extract_agent_workflow_refs_1 = require("../../../../modules/agents/utils/extract-agent-workflow-refs");
const credential_requirements_extractor_1 = require("../credential/credential-requirements.extractor");
const data_table_requirements_extractor_1 = require("../data-table/data-table-requirements.extractor");
const package_export_errors_1 = require("../package-export.errors");
const variable_requirements_extractor_1 = require("../variable/variable-requirements.extractor");
const sub_workflow_node_reference_1 = require("../workflow/references/sub-workflow-node.reference");
let AgentRequirementsExtractor = class AgentRequirementsExtractor {
    constructor(credentialRequirementsExtractor, dataTables, variables) {
        this.credentialRequirementsExtractor = credentialRequirementsExtractor;
        this.dataTables = dataTables;
        this.variables = variables;
    }
    extract({ content, projectId }, origin = 'top-level') {
        const config = content.config;
        const source = { agentId: content.id, projectId };
        const nodeTools = (config?.tools ?? []).filter((tool) => tool.type === 'node');
        const nodes = nodeTools.map(({ node }) => ({
            type: node.nodeType,
            typeVersion: node.nodeTypeVersion,
            parameters: node.nodeParameters,
        }));
        const workflowIds = new Set((0, extract_agent_workflow_refs_1.extractAgentWorkflowRefs)(config).map((tool) => {
            if (!tool.workflowId) {
                throw new package_export_errors_1.PackageExportBlockedError(`Agent "${content.id}" workflow tool "${tool.workflow}" has no workflow ID. Export aborted.`);
            }
            return tool.workflowId;
        }));
        for (const node of nodes) {
            const id = (0, sub_workflow_node_reference_1.getStaticSubworkflowId)(node);
            if (id)
                workflowIds.add(id);
        }
        return {
            credentials: this.credentialRequirementsExtractor
                .extractFromAgent(config)
                .map((reference) => ({
                ...source,
                ...reference,
            })),
            dataTables: this.dataTables
                .extractIds(nodes)
                .map((dataTableId) => ({ ...source, dataTableId })),
            variables: this.variables
                .extractNames({ nodes })
                .map((variableName) => ({ ...source, variableName })),
            tags: [],
            nodeTypes: nodes.length > 0 ? [{ ...source, nodes }] : [],
            workflows: [...workflowIds].map((referencedWorkflowId) => ({
                ...source,
                referencedWorkflowId,
                origin,
            })),
            agentIds: [...new Set((config?.subAgents?.agents ?? []).map(({ agentId }) => agentId))],
        };
    }
};
exports.AgentRequirementsExtractor = AgentRequirementsExtractor;
exports.AgentRequirementsExtractor = AgentRequirementsExtractor = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [credential_requirements_extractor_1.CredentialRequirementsExtractor, data_table_requirements_extractor_1.DataTableRequirementsExtractor, variable_requirements_extractor_1.VariableRequirementsExtractor])
], AgentRequirementsExtractor);
//# sourceMappingURL=agent-requirements.extractor.js.map