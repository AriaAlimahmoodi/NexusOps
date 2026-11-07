import type { AgentExportRequirements, PreparedAgentExport } from './agent-export.types';
import { CredentialRequirementsExtractor } from '../credential/credential-requirements.extractor';
import { DataTableRequirementsExtractor } from '../data-table/data-table-requirements.extractor';
import { VariableRequirementsExtractor } from '../variable/variable-requirements.extractor';
import type { AgentWorkflowRequirement } from '../workflow/workflow.types';
export declare class AgentRequirementsExtractor {
    private readonly credentialRequirementsExtractor;
    private readonly dataTables;
    private readonly variables;
    constructor(credentialRequirementsExtractor: CredentialRequirementsExtractor, dataTables: DataTableRequirementsExtractor, variables: VariableRequirementsExtractor);
    extract({ content, projectId }: PreparedAgentExport, origin?: AgentWorkflowRequirement['origin']): AgentExportRequirements;
}
