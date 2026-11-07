"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagExporter = void 0;
const di_1 = require("@n8n/di");
const manifest_entry_1 = require("../../io/manifest-entry");
const tag_schema_1 = require("../../spec/serialized/tag.schema");
const package_serialization_types_1 = require("../package-serialization.types");
const tag_types_1 = require("./tag.types");
const serializePayload = (0, package_serialization_types_1.definePackageSerializationPayload)();
let TagExporter = class TagExporter {
    async export(request) {
        const requirementsByTagId = new Map();
        for (const { workflowId, tag } of request.usages) {
            const requirement = requirementsByTagId.get(tag.id) ?? {
                id: tag.id,
                name: tag.name,
                usedBy: [],
            };
            if (!requirement.usedBy.some(({ id }) => id === workflowId)) {
                requirement.usedBy.push({ kind: 'workflow', id: workflowId });
            }
            requirementsByTagId.set(tag.id, requirement);
        }
        const requirements = [...requirementsByTagId.values()].sort(tag_types_1.compareTagsByName);
        const tagsDir = (0, manifest_entry_1.packageDirectory)('tags');
        const entries = [];
        for (const { id, name } of requirements) {
            const serializedTag = tag_schema_1.serializedTagSchema.parse(serializePayload({ id, name }));
            entries.push(await (0, manifest_entry_1.writeManifestEntry)(request.writer, 'tags', tagsDir, { id, name }, serializedTag));
        }
        return { entries, requirements };
    }
};
exports.TagExporter = TagExporter;
exports.TagExporter = TagExporter = __decorate([
    (0, di_1.Service)()
], TagExporter);
//# sourceMappingURL=tag.exporter.js.map