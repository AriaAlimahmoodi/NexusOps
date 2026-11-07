import type { Project } from '@n8n/db';
import { ProjectSerializer } from './project.serializer';
import type { PackageWriter } from '../../io/package-writer';
import type { ManifestEntry } from '../../spec/manifest.schema';
export interface ProjectShellExportContext {
    writer: PackageWriter;
    projectEntries: ManifestEntry[];
    projectTargetsById: Map<string, string>;
}
export declare class ProjectShellExporter {
    private readonly projectSerializer;
    constructor(projectSerializer: ProjectSerializer);
    export(project: Project, context: ProjectShellExportContext): Promise<string>;
}
