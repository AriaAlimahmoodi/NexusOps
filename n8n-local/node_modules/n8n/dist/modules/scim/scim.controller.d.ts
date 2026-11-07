import type { ScimUser, ScimListResponse } from '@n8n/api-types';
import { ScimQueryDto, ScimUserCreateDto, ScimPatchRequestDto } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import type { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { ScimService } from './scim.service';
export declare class ScimController {
    private readonly logger;
    private readonly scimService;
    constructor(logger: Logger, scimService: ScimService);
    private scimError;
    private handleError;
    listUsers(_req: AuthenticatedRequest, res: Response, query: ScimQueryDto): Promise<ScimListResponse | Response>;
    getUser(_req: AuthenticatedRequest, res: Response, userId: string): Promise<ScimUser | Response>;
    createUser(_req: AuthenticatedRequest, res: Response, body: ScimUserCreateDto): Promise<ScimUser | Response>;
    replaceUser(_req: AuthenticatedRequest, res: Response, userId: string, body: ScimUserCreateDto): Promise<ScimUser | Response>;
    patchUser(_req: AuthenticatedRequest, res: Response, userId: string, body: ScimPatchRequestDto): Promise<ScimUser | Response>;
    deleteUser(_req: AuthenticatedRequest, res: Response, userId: string): Promise<Response>;
}
