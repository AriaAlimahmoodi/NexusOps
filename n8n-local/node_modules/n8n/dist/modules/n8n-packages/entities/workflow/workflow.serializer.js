"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowSerializer = void 0;
const di_1 = require("@n8n/di");
const workflow_metadata_schema_1 = require("../../spec/serialized/workflow-metadata.schema");
const workflow_schema_1 = require("../../spec/serialized/workflow.schema");
const package_serialization_types_1 = require("../package-serialization.types");
const tag_types_1 = require("../tag/tag.types");
const serializePayload = (0, package_serialization_types_1.definePackageSerializationPayload)();
const serializeMetadataPayload = (0, package_serialization_types_1.definePackageSerializationPayload)();
let WorkflowSerializer = class WorkflowSerializer {
    serialize(workflow, options) {
        const tags = options.includeTags
            ? [...(workflow.tags ?? [])].sort(tag_types_1.compareTagsByName)
            : undefined;
        return workflow_schema_1.serializedWorkflowSchema.parse(serializePayload({
            id: workflow.id,
            name: workflow.name,
            nodes: workflow.nodes,
            connections: workflow.connections,
            settings: workflow.settings ? { ...workflow.settings } : undefined,
            parentFolderId: workflow.parentFolder?.id ?? null,
            isArchived: workflow.isArchived,
            ...(workflow.nodeGroups?.length ? { nodeGroups: workflow.nodeGroups } : {}),
            ...(tags ? { tagIds: tags.map((tag) => tag.id) } : {}),
        }));
    }
    serializeMetadata(workflow) {
        return workflow_metadata_schema_1.serializedWorkflowMetadataSchema.parse(serializeMetadataPayload({
            versionId: workflow.versionId,
            publishedVersionId: workflow.activeVersionId,
        }));
    }
    deserialize(wire) {
        const parsed = workflow_schema_1.serializedWorkflowSchema.parse(wire);
        return {
            name: parsed.name,
            nodes: parsed.nodes,
            connections: parsed.connections,
            nodeGroups: parsed.nodeGroups ?? [],
            isArchived: parsed.isArchived,
            ...(parsed.settings !== undefined ? { settings: parsed.settings } : {}),
        };
    }
};
exports.WorkflowSerializer = WorkflowSerializer;
exports.WorkflowSerializer = WorkflowSerializer = __decorate([
    (0, di_1.Service)()
], WorkflowSerializer);
//# sourceMappingURL=workflow.serializer.js.map