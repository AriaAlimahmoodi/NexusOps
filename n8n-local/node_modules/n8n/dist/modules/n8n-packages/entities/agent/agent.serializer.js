"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentSerializer = void 0;
const di_1 = require("@n8n/di");
const agent_schema_1 = require("../../spec/serialized/agent.schema");
const package_export_errors_1 = require("../package-export.errors");
const package_serialization_types_1 = require("../package-serialization.types");
const serializePayload = (0, package_serialization_types_1.definePackageSerializationPayload)();
const serializeMetadataPayload = (0, package_serialization_types_1.definePackageSerializationPayload)();
let AgentSerializer = class AgentSerializer {
    serialize(agent, definition, integrations) {
        const config = definition.schema ? { ...definition.schema, integrations } : null;
        const content = agent_schema_1.serializedAgentSchema.parse(serializePayload({
            id: agent.id,
            name: agent.name,
            config,
            availableInMCP: agent.availableInMCP,
            skills: this.referencedBodies(agent.id, 'skill', config?.skills ?? [], definition.skills),
            tools: this.referencedBodies(agent.id, 'custom tool', config?.tools?.filter((tool) => tool.type === 'custom') ?? [], definition.tools),
            tasks: this.referencedBodies(agent.id, 'task', config?.tasks ?? [], Object.fromEntries(definition.tasks)),
        }));
        return structuredClone(content);
    }
    serializeMetadata(source) {
        return agent_schema_1.serializedAgentMetadataSchema.parse(serializeMetadataPayload({
            versionId: source.versionId,
            publishedVersionId: source.activeVersionId,
        }));
    }
    referencedBodies(agentId, kind, references, bodies) {
        return Object.fromEntries(references.map(({ id }) => {
            const body = Object.hasOwn(bodies, id) ? bodies[id] : undefined;
            if (body === undefined) {
                throw new package_export_errors_1.PackageExportBlockedError(`Agent "${agentId}" references missing ${kind} "${id}". Export aborted.`);
            }
            return [id, body];
        }));
    }
};
exports.AgentSerializer = AgentSerializer;
exports.AgentSerializer = AgentSerializer = __decorate([
    (0, di_1.Service)()
], AgentSerializer);
//# sourceMappingURL=agent.serializer.js.map