import { CreatePolicyDocumentDto, ListNodeTypePolicyDocumentsQueryDto, PolicyAttachmentsPublicDto, PolicyDocumentListPublicDto, PolicyDocumentPublicDto, PolicyDocumentWriteResultPublicDto, PolicyEffectivePublicDto, PolicyEffectiveWriteResultPublicDto, PutInstancePolicyDto, PutProjectPolicyDto, ReplaceAttachmentsDto, UpdatePolicyDocumentDto } from '@n8n/api-types';
import { ModuleRegistry } from '@n8n/backend-common';
import type { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
export declare class NodeTypePoliciesPublicController {
    private readonly moduleRegistry;
    constructor(moduleRegistry: ModuleRegistry);
    private service;
    getNodeTypeInstancePolicy(): Promise<PolicyEffectivePublicDto>;
    putNodeTypeInstancePolicy(req: AuthenticatedRequest, _res: Response, dto: PutInstancePolicyDto): Promise<PolicyEffectiveWriteResultPublicDto>;
    getNodeTypeProjectPolicy(_req: AuthenticatedRequest, _res: Response, projectId: string): Promise<PolicyEffectivePublicDto>;
    putNodeTypeProjectPolicy(req: AuthenticatedRequest, _res: Response, projectId: string, dto: PutProjectPolicyDto): Promise<PolicyEffectiveWriteResultPublicDto>;
    listNodeTypePolicyDocuments(_req: AuthenticatedRequest, _res: Response, query: ListNodeTypePolicyDocumentsQueryDto): Promise<PolicyDocumentListPublicDto>;
    createNodeTypePolicyDocument(req: AuthenticatedRequest, _res: Response, dto: CreatePolicyDocumentDto): Promise<PolicyDocumentWriteResultPublicDto>;
    getNodeTypePolicyDocument(_req: AuthenticatedRequest, _res: Response, policyId: string): Promise<PolicyDocumentPublicDto>;
    updateNodeTypePolicyDocument(req: AuthenticatedRequest, _res: Response, policyId: string, dto: UpdatePolicyDocumentDto): Promise<PolicyDocumentWriteResultPublicDto>;
    deleteNodeTypePolicyDocument(req: AuthenticatedRequest, _res: Response, policyId: string): Promise<void>;
    getNodeTypePolicyAttachments(_req: AuthenticatedRequest, _res: Response, scopeId: string): Promise<PolicyAttachmentsPublicDto>;
    replaceNodeTypePolicyAttachments(req: AuthenticatedRequest, _res: Response, scopeId: string, dto: ReplaceAttachmentsDto): Promise<PolicyAttachmentsPublicDto>;
}
