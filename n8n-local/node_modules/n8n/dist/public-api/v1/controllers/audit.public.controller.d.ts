import { GenerateAuditPublicDto, type AuditPublic } from '@n8n/api-types';
import type { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { SecurityAuditService } from '../../../security-audit/security-audit.service';
export declare class AuditPublicController {
    private readonly securityAuditService;
    constructor(securityAuditService: SecurityAuditService);
    generateAudit(_req: AuthenticatedRequest, _res: Response, body: GenerateAuditPublicDto): Promise<AuditPublic>;
}
