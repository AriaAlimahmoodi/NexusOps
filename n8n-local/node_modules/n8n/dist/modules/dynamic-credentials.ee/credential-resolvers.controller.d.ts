import { CreateCredentialResolverDto, CredentialResolver, ListCredentialResolversQueryDto, UpdateCredentialResolverDto, CredentialResolverType, type CredentialResolverAffectedWorkflow } from '@n8n/api-types';
import { AuthenticatedRequest } from '@n8n/db';
import { Response } from 'express';
import { DynamicCredentialResolverService } from './services/credential-resolver.service';
export declare class CredentialResolversController {
    private readonly service;
    constructor(service: DynamicCredentialResolverService);
    private redactSecrets;
    listResolvers(_req: AuthenticatedRequest, _res: Response, query: ListCredentialResolversQueryDto): Promise<CredentialResolver[]>;
    listResolverTypes(_req: AuthenticatedRequest, _res: Response): CredentialResolverType[];
    createResolver(req: AuthenticatedRequest, _res: Response, dto: CreateCredentialResolverDto): Promise<CredentialResolver>;
    getAffectedWorkflows(_req: AuthenticatedRequest, _res: Response, id: string): Promise<CredentialResolverAffectedWorkflow[]>;
    getResolver(_req: AuthenticatedRequest, _res: Response, id: string): Promise<CredentialResolver>;
    updateResolver(req: AuthenticatedRequest, _res: Response, id: string, dto: UpdateCredentialResolverDto): Promise<CredentialResolver>;
    deleteResolver(_req: AuthenticatedRequest, _res: Response, id: string): Promise<{
        success: true;
    }>;
}
