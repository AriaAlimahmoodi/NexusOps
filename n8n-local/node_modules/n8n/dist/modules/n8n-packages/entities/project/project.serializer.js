"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectSerializer = void 0;
const di_1 = require("@n8n/di");
const project_schema_1 = require("../../spec/serialized/project.schema");
const package_serialization_types_1 = require("../package-serialization.types");
const serializePayload = (0, package_serialization_types_1.definePackageSerializationPayload)();
let ProjectSerializer = class ProjectSerializer {
    serialize(project) {
        return project_schema_1.serializedProjectSchema.parse(serializePayload({
            id: project.id,
            name: project.name,
            ...(project.description !== null ? { description: project.description } : {}),
            ...(project.icon !== null ? { icon: project.icon } : {}),
            ...(project.customTelemetryTags?.length
                ? { customTelemetryTags: project.customTelemetryTags }
                : {}),
        }));
    }
};
exports.ProjectSerializer = ProjectSerializer;
exports.ProjectSerializer = ProjectSerializer = __decorate([
    (0, di_1.Service)()
], ProjectSerializer);
//# sourceMappingURL=project.serializer.js.map