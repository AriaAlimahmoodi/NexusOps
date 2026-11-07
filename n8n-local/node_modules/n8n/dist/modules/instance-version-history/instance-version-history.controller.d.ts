import { VersionQueryDto, VersionSinceDateQueryDto } from '@n8n/api-types';
import { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { InstanceVersionHistoryService } from './instance-version-history.service';
export declare class InstanceVersionHistoryController {
    private readonly service;
    constructor(service: InstanceVersionHistoryService);
    getMinVersionSince(_req: AuthenticatedRequest, _res: Response, query: VersionSinceDateQueryDto): Promise<{
        version: import("./instance-version-history.types").SemVer | null;
    }>;
    getDateSinceVersion(_req: AuthenticatedRequest, _res: Response, query: VersionQueryDto): Promise<{
        date: string | null;
    }>;
    getCurrentVersionDate(): Promise<{
        version: null;
        createdAt: null;
    } | {
        version: {
            major: number;
            minor: number;
            patch: number;
        };
        createdAt: string;
    }>;
    getFirstAdoption(_req: AuthenticatedRequest, _res: Response, query: VersionQueryDto): Promise<{
        date: string | null;
    }>;
}
