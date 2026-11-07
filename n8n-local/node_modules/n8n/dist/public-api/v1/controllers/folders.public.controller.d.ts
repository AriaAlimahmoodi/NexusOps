import { CreateFolderPublicDto, CreatedFolderPublicDto, DeleteFolderQueryPublicDto, FolderDetailsPublicDto, FolderListPublicDto, ListFoldersQueryPublicDto, UpdateFolderPublicDto, UpdatedFolderPublicDto } from '@n8n/api-types';
import type { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { FolderService } from '../../../services/folder.service';
import { ProjectService } from '../../../services/project.service.ee';
export declare class FoldersPublicController {
    private readonly folderService;
    private readonly projectService;
    constructor(folderService: FolderService, projectService: ProjectService);
    listFolders(req: AuthenticatedRequest, _res: Response, projectId: string, query: ListFoldersQueryPublicDto): Promise<FolderListPublicDto>;
    createFolder(req: AuthenticatedRequest, _res: Response, projectId: string, body: CreateFolderPublicDto): Promise<CreatedFolderPublicDto>;
    getFolder(req: AuthenticatedRequest, _res: Response, projectId: string, folderId: string): Promise<FolderDetailsPublicDto>;
    updateFolder(req: AuthenticatedRequest, _res: Response, projectId: string, folderId: string, body: UpdateFolderPublicDto): Promise<UpdatedFolderPublicDto>;
    deleteFolder(req: AuthenticatedRequest, _res: Response, projectId: string, folderId: string, query: DeleteFolderQueryPublicDto): Promise<void>;
    private resolveProjectId;
}
