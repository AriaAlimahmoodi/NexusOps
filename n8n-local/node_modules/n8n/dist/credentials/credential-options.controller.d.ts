import { CredentialOptionsRequestDto } from '@n8n/api-types';
import { AuthenticatedRequest } from '@n8n/db';
import { CredentialOptionsService } from './credential-options.service';
export declare class CredentialOptionsController {
    private readonly credentialOptionsService;
    constructor(credentialOptionsService: CredentialOptionsService);
    lookupProjectDraft(req: AuthenticatedRequest, _res: unknown, projectId: string, request: CredentialOptionsRequestDto): Promise<import("n8n-workflow").INodeListSearchResult>;
    lookupInstanceDraft(req: AuthenticatedRequest, _res: unknown, request: CredentialOptionsRequestDto): Promise<import("n8n-workflow").INodeListSearchResult>;
    lookupStored(req: AuthenticatedRequest, _res: unknown, credentialId: string, request: CredentialOptionsRequestDto): Promise<import("n8n-workflow").INodeListSearchResult>;
}
