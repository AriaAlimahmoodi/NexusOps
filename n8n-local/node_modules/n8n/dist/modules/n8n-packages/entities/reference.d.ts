import type { WorkflowEntity } from '@n8n/db';
import type { RequirementsExtractor } from './requirements-extractor';
import type { PackageImportBindings } from '../n8n-packages.types';
export interface EntityReference<TRequirement> extends RequirementsExtractor<TRequirement> {
    apply(workflow: WorkflowEntity, bindings: PackageImportBindings): void;
}
