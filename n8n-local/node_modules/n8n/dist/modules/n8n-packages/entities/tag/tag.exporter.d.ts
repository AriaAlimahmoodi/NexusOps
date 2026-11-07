import type { PackageWriter } from '../../io/package-writer';
import type { ManifestEntry } from '../../spec/manifest.schema';
import type { PackageTagRequirement } from '../../spec/requirements.schema';
import { type WorkflowTagUsage } from './tag.types';
export interface TagExportRequest {
    usages: WorkflowTagUsage[];
    writer: PackageWriter;
}
export interface TagExportResult {
    entries: ManifestEntry[];
    requirements: PackageTagRequirement[];
}
export declare class TagExporter {
    export(request: TagExportRequest): Promise<TagExportResult>;
}
