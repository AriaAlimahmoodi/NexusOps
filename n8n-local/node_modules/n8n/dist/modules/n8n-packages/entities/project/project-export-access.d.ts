import type { Project, User } from '@n8n/db';
import type { ProjectService } from '../../../../services/project.service.ee';
export declare function findExportableProjects(projectService: ProjectService, user: User, projectIds: string[]): Promise<Project[]>;
