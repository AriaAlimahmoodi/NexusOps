import { type INode } from 'n8n-workflow';
import type { WorkflowDataTableRequirement } from './data-table.types';
import type { RequirementsExtractor } from '../requirements-extractor';
export declare class DataTableRequirementsExtractor implements RequirementsExtractor<WorkflowDataTableRequirement> {
    extract(workflow: {
        id: string;
        nodes?: INode[];
    }): WorkflowDataTableRequirement[];
    extractIds(nodes: Array<{
        type: string;
        parameters?: Record<string, unknown>;
    }>): string[];
}
