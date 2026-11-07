import type { WorkflowVariableRequirement } from './variable.types';
import type { RequirementsExtractor } from '../requirements-extractor';
export interface VariableScanSource {
    id: string;
    nodes?: Array<{
        parameters?: unknown;
    }>;
    settings?: unknown;
}
export declare class VariableRequirementsExtractor implements RequirementsExtractor<WorkflowVariableRequirement> {
    extract(workflow: VariableScanSource): WorkflowVariableRequirement[];
    extractNames(source: Omit<VariableScanSource, 'id'>): string[];
    private scan;
}
