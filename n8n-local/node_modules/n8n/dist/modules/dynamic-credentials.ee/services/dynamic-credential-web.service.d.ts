import { Request } from 'express';
import { ExecutionContextService } from 'n8n-core';
import { ICredentialContext } from 'n8n-workflow';
import { AuthService } from '../../../auth/auth.service';
export declare class DynamicCredentialWebService {
    private readonly authService;
    private readonly executionContextService;
    constructor(authService: AuthService, executionContextService: ExecutionContextService);
    private buildCookieCredentialContext;
    getCredentialContextFromRequest(req: Request): ICredentialContext;
}
