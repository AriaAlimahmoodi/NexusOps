import type { CreateFolderDto, DeleteFolderDto, UpdateFolderDto } from '@n8n/api-types';
import { EventService } from '@n8n/backend-services';
import type { FolderWithWorkflowAndSubFolderCountAndPath, User } from '@n8n/db';
import { Folder, FolderTagMappingRepository, FolderRepository, WorkflowRepository } from '@n8n/db';
import type { EntityManager } from '@n8n/typeorm';
import type { ListQuery } from '../requests';
import { WorkflowService } from '../workflows/workflow.service';
export interface SimpleFolderNode {
    id: string;
    name: string;
    children: SimpleFolderNode[];
}
export declare class FolderService {
    private readonly folderRepository;
    private readonly folderTagMappingRepository;
    private readonly workflowRepository;
    private readonly workflowService;
    private readonly eventService;
    constructor(folderRepository: FolderRepository, folderTagMappingRepository: FolderTagMappingRepository, workflowRepository: WorkflowRepository, workflowService: WorkflowService, eventService: EventService);
    createFolder({ parentFolderId, name }: CreateFolderDto, projectId: string, id?: string): Promise<{
        id: string;
        generateId(): void;
        createdAt: Date;
        updatedAt: Date;
        setUpdateDate(): void;
        name: string;
        parentFolderId: string | null;
        parentFolder: Folder | null;
        subFolders: Folder[];
        workflows: import("@n8n/db").WorkflowEntity[];
        tags: import("@n8n/db").TagEntity[];
    }>;
    getFoldersByIds(folderIds: string[]): Promise<Folder[]>;
    getFolderPlacementsInProject(projectId: string): Promise<Array<{
        id: string;
        name: string;
        parentFolderId: string | null;
    }>>;
    updateFolder(folderId: string, projectId: string, { name, tagIds, parentFolderId }: UpdateFolderDto): Promise<Folder>;
    findFolderInProjectOrFail(folderId: string, projectId: string, em?: EntityManager): Promise<Folder>;
    getFolderTree(folderId: string, projectId: string): Promise<SimpleFolderNode[]>;
    flattenAndArchive(user: User, folderId: string, projectId: string): Promise<void>;
    deleteFolder(user: User, folderId: string, projectId: string, { transferToFolderId }: DeleteFolderDto): Promise<void>;
    transferAllFoldersToProject(fromProjectId: string, toProjectId: string, tx?: EntityManager): Promise<import("@n8n/typeorm").UpdateResult>;
    private transformFolderPathToTree;
    private isDescendant;
    findFolderWithContentCounts(folderId: string, projectId: string): Promise<{
        folder: Folder;
        totalSubFolders: number;
        totalWorkflows: number;
    }>;
    getManyAndCount(projectId: string, options: ListQuery.Options): Promise<[FolderWithWorkflowAndSubFolderCountAndPath[], number]>;
    private enrichFoldersWithPaths;
}
