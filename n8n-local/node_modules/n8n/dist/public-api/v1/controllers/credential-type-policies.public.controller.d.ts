import { CreateCredentialTypePolicyDocumentDto, ListNodeTypePolicyDocumentsQueryDto, CredentialTypePolicyAttachmentsPublicDto, CredentialTypePolicyDocumentListPublicDto, CredentialTypePolicyDocumentPublicDto, CredentialTypePolicyDocumentWriteResultPublicDto, CredentialTypePolicyEffectivePublicDto, CredentialTypePolicyEffectiveWriteResultPublicDto, PutCredentialTypeInstancePolicyDto, PutCredentialTypeProjectPolicyDto, ReplaceAttachmentsDto, UpdateCredentialTypePolicyDocumentDto } from '@n8n/api-types';
import { ModuleRegistry } from '@n8n/backend-common';
import type { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
export declare class CredentialTypePoliciesPublicController {
    private readonly moduleRegistry;
    constructor(moduleRegistry: ModuleRegistry);
    private service;
    getCredentialTypeInstancePolicy(): Promise<CredentialTypePolicyEffectivePublicDto>;
    putCredentialTypeInstancePolicy(req: AuthenticatedRequest, _res: Response, dto: PutCredentialTypeInstancePolicyDto): Promise<CredentialTypePolicyEffectiveWriteResultPublicDto>;
    getCredentialTypeProjectPolicy(_req: AuthenticatedRequest, _res: Response, projectId: string): Promise<CredentialTypePolicyEffectivePublicDto>;
    putCredentialTypeProjectPolicy(req: AuthenticatedRequest, _res: Response, projectId: string, dto: PutCredentialTypeProjectPolicyDto): Promise<CredentialTypePolicyEffectiveWriteResultPublicDto>;
    listCredentialTypePolicyDocuments(_req: AuthenticatedRequest, _res: Response, query: ListNodeTypePolicyDocumentsQueryDto): Promise<CredentialTypePolicyDocumentListPublicDto>;
    createCredentialTypePolicyDocument(req: AuthenticatedRequest, _res: Response, dto: CreateCredentialTypePolicyDocumentDto): Promise<CredentialTypePolicyDocumentWriteResultPublicDto>;
    getCredentialTypePolicyDocument(_req: AuthenticatedRequest, _res: Response, policyId: string): Promise<CredentialTypePolicyDocumentPublicDto>;
    updateCredentialTypePolicyDocument(req: AuthenticatedRequest, _res: Response, policyId: string, dto: UpdateCredentialTypePolicyDocumentDto): Promise<CredentialTypePolicyDocumentWriteResultPublicDto>;
    deleteCredentialTypePolicyDocument(req: AuthenticatedRequest, _res: Response, policyId: string): Promise<void>;
    getCredentialTypePolicyAttachments(_req: AuthenticatedRequest, _res: Response, scopeId: string): Promise<CredentialTypePolicyAttachmentsPublicDto>;
    replaceCredentialTypePolicyAttachments(req: AuthenticatedRequest, _res: Response, scopeId: string, dto: ReplaceAttachmentsDto): Promise<CredentialTypePolicyAttachmentsPublicDto>;
}
