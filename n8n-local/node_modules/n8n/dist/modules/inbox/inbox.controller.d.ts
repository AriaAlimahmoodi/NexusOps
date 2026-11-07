import { ListInboxQueryDto } from '@n8n/api-types';
import { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { InboxService } from './inbox.service';
export declare class InboxController {
    private readonly inboxService;
    constructor(inboxService: InboxService);
    list(req: AuthenticatedRequest, _res: Response, query: ListInboxQueryDto): Promise<import("@n8n/api-types").ListInboxResponse>;
    getSummary(req: AuthenticatedRequest): Promise<import("@n8n/api-types").GetInboxSummaryResponse>;
}
