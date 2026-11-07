import { CreateFolderDto, DeleteFolderDto, ListFolderQueryDto, TransferFolderBodyDto, UpdateFolderDto } from '@n8n/api-types';
import { AuthenticatedRequest } from '@n8n/db';
import { NextFunction, Response } from 'express';
import { FolderService } from '../services/folder.service';
import { ProjectService } from '../services/project.service.ee';
import { EnterpriseWorkflowService } from '../workflows/workflow.service.ee';
export declare class ProjectController {
    private readonly folderService;
    private readonly enterpriseWorkflowService;
    private readonly projectService;
    constructor(folderService: FolderService, enterpriseWorkflowService: EnterpriseWorkflowService, projectService: ProjectService);
    validateProjectExists(req: AuthenticatedRequest<{
        projectId: string;
    }>, res: Response, next: NextFunction): Promise<void>;
    createFolder(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, payload: CreateFolderDto): Promise<{
        id: string;
        generateId(): void;
        createdAt: Date;
        updatedAt: Date;
        setUpdateDate(): void;
        name: string;
        parentFolderId: string | null;
        parentFolder: import("@n8n/db").Folder | null;
        subFolders: import("@n8n/db").Folder[];
        workflows: import("@n8n/db").WorkflowEntity[];
        tags: import("@n8n/db").TagEntity[];
    }>;
    getFolderTree(req: AuthenticatedRequest<{
        projectId: string;
        folderId: string;
    }>, _res: Response): Promise<import("../services/folder.service").SimpleFolderNode[]>;
    getFolderUsedCredentials(req: AuthenticatedRequest<{
        projectId: string;
        folderId: string;
    }>, _res: Response): Promise<import("@n8n/db").CredentialUsedByWorkflow[]>;
    updateFolder(req: AuthenticatedRequest<{
        projectId: string;
        folderId: string;
    }>, _res: Response, payload: UpdateFolderDto): Promise<void>;
    deleteFolder(req: AuthenticatedRequest<{
        projectId: string;
        folderId: string;
    }>, _res: Response, payload: DeleteFolderDto): Promise<void>;
    listFolders(req: AuthenticatedRequest<{
        projectId: string;
    }>, res: Response, payload: ListFolderQueryDto): Promise<void>;
    getFolderContent(req: AuthenticatedRequest<{
        projectId: string;
        folderId: string;
    }>): Promise<{
        totalSubFolders: number;
        totalWorkflows: number;
    }>;
    transferFolderToProject(req: AuthenticatedRequest, _res: unknown, sourceFolderId: string, sourceProjectId: string, body: TransferFolderBodyDto): Promise<void>;
}
