import { CreateTagPublicDto, ListTagsQueryDto, TagListPublicDto, TagPublicDto, UpdateTagPublicDto, UpdatedTagPublicDto } from '@n8n/api-types';
import type { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { TagService } from '../../../services/tag.service';
export declare class TagsPublicController {
    private readonly tagService;
    constructor(tagService: TagService);
    getTags(_req: AuthenticatedRequest, _res: Response, query: ListTagsQueryDto): Promise<TagListPublicDto>;
    createTag(_req: AuthenticatedRequest, _res: Response, body: CreateTagPublicDto): Promise<TagPublicDto>;
    getTag(_req: AuthenticatedRequest, _res: Response, tagId: string): Promise<TagPublicDto>;
    updateTag(_req: AuthenticatedRequest, _res: Response, tagId: string, body: UpdateTagPublicDto): Promise<UpdatedTagPublicDto>;
    deleteTag(_req: AuthenticatedRequest, _res: Response, tagId: string): Promise<TagPublicDto>;
}
