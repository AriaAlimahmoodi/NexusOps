import { DiscoverPublicDto, DiscoverQueryPublicDto } from '@n8n/api-types';
import type { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
export declare class DiscoverPublicController {
    getDiscover(req: AuthenticatedRequest, _res: Response, query: DiscoverQueryPublicDto): Promise<DiscoverPublicDto>;
}
