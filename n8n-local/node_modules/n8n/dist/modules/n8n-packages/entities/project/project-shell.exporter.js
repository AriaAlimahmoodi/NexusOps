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
exports.ProjectShellExporter = void 0;
const di_1 = require("@n8n/di");
const project_serializer_1 = require("./project.serializer");
const manifest_entry_1 = require("../../io/manifest-entry");
let ProjectShellExporter = class ProjectShellExporter {
    constructor(projectSerializer) {
        this.projectSerializer = projectSerializer;
    }
    async export(project, context) {
        const existing = context.projectTargetsById.get(project.id);
        if (existing !== undefined)
            return existing;
        const entry = await (0, manifest_entry_1.writeManifestEntry)(context.writer, 'projects', (0, manifest_entry_1.packageDirectory)('projects'), project, this.projectSerializer.serialize(project));
        context.projectEntries.push(entry);
        context.projectTargetsById.set(entry.id, entry.target);
        return entry.target;
    }
};
exports.ProjectShellExporter = ProjectShellExporter;
exports.ProjectShellExporter = ProjectShellExporter = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [project_serializer_1.ProjectSerializer])
], ProjectShellExporter);
//# sourceMappingURL=project-shell.exporter.js.map