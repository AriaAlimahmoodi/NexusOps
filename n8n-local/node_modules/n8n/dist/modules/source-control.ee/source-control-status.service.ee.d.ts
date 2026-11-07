import type { SourceControlledFile } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { EventService } from '@n8n/backend-services';
import { FolderRepository, TagRepository, type User, WorkflowRepository } from '@n8n/db';
import { SourceControlContextFactory } from './source-control-context.factory';
import { SourceControlGitService } from './source-control-git.service.ee';
import { SourceControlImportService } from './source-control-import.service.ee';
import { SourceControlPreferencesService } from './source-control-preferences.service.ee';
import type { SourceControlGetStatus, SourceControlGetStatusVerboseResult } from './types/source-control-get-status';
export declare class SourceControlStatusService {
    private readonly logger;
    private readonly gitService;
    private readonly sourceControlImportService;
    private readonly sourceControlPreferencesService;
    private readonly sourceControlContextFactory;
    private readonly tagRepository;
    private readonly folderRepository;
    private readonly workflowRepository;
    private readonly eventService;
    constructor(logger: Logger, gitService: SourceControlGitService, sourceControlImportService: SourceControlImportService, sourceControlPreferencesService: SourceControlPreferencesService, sourceControlContextFactory: SourceControlContextFactory, tagRepository: TagRepository, folderRepository: FolderRepository, workflowRepository: WorkflowRepository, eventService: EventService);
    private get gitFolder();
    private get dataTableExportFolder();
    private convertToStatusResourceOwner;
    private buildFolderPath;
    getStatus(user: User, options: SourceControlGetStatus & {
        verbose: true;
    }): Promise<SourceControlGetStatusVerboseResult>;
    getStatus(user: User, options: SourceControlGetStatus & {
        verbose?: false;
    }): Promise<SourceControlledFile[]>;
    getStatus(user: User, options: SourceControlGetStatus & {
        verbose: boolean;
    }): Promise<SourceControlledFile[] | SourceControlGetStatusVerboseResult>;
    private resetWorkfolder;
    private populateMissingLocalFolderPathNodes;
    private getStatusWorkflows;
    private getStatusCredentials;
    private getStatusVariables;
    private getStatusDataTables;
    private getStatusTagsMappings;
    private getStatusFoldersMapping;
    private getStatusProjects;
    private areVariablesEqual;
    private isProjectModified;
    private isProjectIconModified;
}
