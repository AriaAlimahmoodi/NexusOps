import { ModuleRegistry } from '@n8n/backend-common';
import { ProjectScopeService } from '@n8n/backend-services';
import { ProjectService } from '../../../../services/project.service.ee';
import type { AgentSelectionExportRequest, AgentSelectionExportResult } from './agent-export.types';
import { AgentRequirementsExtractor } from './agent-requirements.extractor';
import { ProjectShellExporter } from '../project/project-shell.exporter';
export declare class AgentSelectionExporter {
    private readonly moduleRegistry;
    private readonly projectScopeService;
    private readonly projectService;
    private readonly projectShellExporter;
    private readonly requirementsExtractor;
    constructor(moduleRegistry: ModuleRegistry, projectScopeService: ProjectScopeService, projectService: ProjectService, projectShellExporter: ProjectShellExporter, requirementsExtractor: AgentRequirementsExtractor);
    export(request: AgentSelectionExportRequest): Promise<AgentSelectionExportResult>;
    private prepareSelection;
    private enqueueDependencies;
    private assertAgentDependenciesIncluded;
    private addProjectShells;
    private collectAgentRequirements;
}
