import { LicenseState } from '@n8n/backend-common';
import type { User } from '@n8n/db';
import { ProjectService } from '../../../../services/project.service.ee';
import type { PreparedProject, ProjectImportPlan, ProjectPlanItem } from './project-import.types';
import type { ImportedProjectSummary, ProjectConflictPolicy } from '../../n8n-packages.types';
export declare class ProjectImporter {
    private readonly projectService;
    private readonly licenseState;
    constructor(projectService: ProjectService, licenseState: LicenseState);
    plan(user: User, projects: PreparedProject[], policy: ProjectConflictPolicy): Promise<ProjectImportPlan>;
    apply(user: User, items: ProjectPlanItem[]): Promise<ImportedProjectSummary[]>;
    private assertCanCreateProjects;
}
