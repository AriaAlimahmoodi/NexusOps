import type { CredentialRequirement } from './credential/credential.types';
import type { DataTableRequirement } from './data-table/data-table.types';
import type { WorkflowTagUsage } from './tag/tag.types';
import type { VariableRequirement } from './variable/variable.types';
import type { NodeTypeSource } from './workflow/node-type-usage';
export interface ExportRequirements {
    credentials: CredentialRequirement[];
    dataTables: DataTableRequirement[];
    variables: VariableRequirement[];
    tags: WorkflowTagUsage[];
    nodeTypes: NodeTypeSource[];
}
export declare const mergeRequirements: (...parts: Array<ExportRequirements | undefined>) => ExportRequirements;
