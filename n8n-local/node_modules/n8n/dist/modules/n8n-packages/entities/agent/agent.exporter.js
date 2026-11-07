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
exports.AgentExporter = void 0;
const api_types_1 = require("@n8n/api-types");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const agent_definition_service_1 = require("../../../../modules/agents/agent-definition.service");
const agent_entity_1 = require("../../../../modules/agents/entities/agent.entity");
const agent_serializer_1 = require("./agent.serializer");
const entity_file_format_1 = require("../../io/entity-file-format");
const manifest_entry_1 = require("../../io/manifest-entry");
const n8n_packages_types_1 = require("../../n8n-packages.types");
const package_export_errors_1 = require("../package-export.errors");
let AgentExporter = class AgentExporter {
    constructor(definitionService, serializer) {
        this.definitionService = definitionService;
        this.serializer = serializer;
    }
    async prepare(agent, policy = n8n_packages_types_1.ExportVersionPolicy.Latest) {
        if (!(0, agent_entity_1.isProjectAgent)(agent)) {
            throw new n8n_workflow_1.UnexpectedError('Only project agents can be exported', {
                extra: { agentId: agent.id },
            });
        }
        if (agent.activeVersionId === null) {
            if (policy === n8n_packages_types_1.ExportVersionPolicy.IgnoreUnpublished)
                return undefined;
            if (policy === n8n_packages_types_1.ExportVersionPolicy.PublishedStrict) {
                throw new package_export_errors_1.PackageExportBlockedError(`Agent "${agent.id}" has no published version. Export aborted.`);
            }
        }
        let definition;
        let versionId = agent.versionId;
        let integrations = agent.integrations ?? [];
        if (policy !== n8n_packages_types_1.ExportVersionPolicy.Latest && agent.activeVersionId !== null) {
            const version = agent.activeVersion;
            if (!version) {
                throw new n8n_workflow_1.UnexpectedError('Published version was not loaded for Agent', {
                    extra: { agentId: agent.id, activeVersionId: agent.activeVersionId },
                });
            }
            definition = await this.definitionService.readVersion(version);
            versionId = version.versionId;
            integrations = [
                ...integrations.filter(api_types_1.isCredentialAgentIntegration),
                ...(definition.schema?.integrations ?? []).filter(({ type }) => type === api_types_1.N8N_CHAT_INTEGRATION_TYPE),
            ];
        }
        else {
            definition = await this.definitionService.readDraft(agent);
        }
        const content = this.serializer.serialize(agent, definition, integrations);
        return {
            projectId: agent.projectId,
            content,
            metadata: this.serializer.serializeMetadata({
                versionId,
                activeVersionId: agent.activeVersionId,
            }),
        };
    }
    async write(snapshot, writer, basePrefix = '') {
        const entry = await (0, manifest_entry_1.writeManifestEntry)(writer, 'agents', (0, manifest_entry_1.packageDirectory)('agents', basePrefix), snapshot.content, snapshot.content);
        await writer.writeFile((0, manifest_entry_1.agentMetadataFilePath)(entry.target), (0, entity_file_format_1.formatEntityFile)(snapshot.metadata));
        return entry;
    }
};
exports.AgentExporter = AgentExporter;
exports.AgentExporter = AgentExporter = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [agent_definition_service_1.AgentDefinitionService, agent_serializer_1.AgentSerializer])
], AgentExporter);
//# sourceMappingURL=agent.exporter.js.map