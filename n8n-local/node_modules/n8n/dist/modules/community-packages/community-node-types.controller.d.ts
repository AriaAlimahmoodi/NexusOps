import type { CommunityNodeType } from '@n8n/api-types';
import { Request } from 'express';
import { CommunityNodeTypesService } from './community-node-types.service';
export declare class CommunityNodeTypesController {
    private readonly communityNodeTypesService;
    constructor(communityNodeTypesService: CommunityNodeTypesService);
    getCommunityNodeType(req: Request): Promise<CommunityNodeType | null>;
    getCommunityNodeTypes(): Promise<CommunityNodeType[]>;
}
