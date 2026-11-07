import { AuthenticatedRequest } from '@n8n/db';
import express from 'express';
import { CtaService } from '../services/cta.service';
export declare class CtaController {
    private readonly ctaService;
    constructor(ctaService: CtaService);
    getCta(req: AuthenticatedRequest, res: express.Response): Promise<void>;
}
