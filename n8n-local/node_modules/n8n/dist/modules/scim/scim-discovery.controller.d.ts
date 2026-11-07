import type { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
export declare class ScimDiscoveryController {
    getServiceProviderConfig(_req: AuthenticatedRequest, res: Response): Response<any, Record<string, any>>;
    getResourceTypes(_req: AuthenticatedRequest, res: Response): Response<any, Record<string, any>>;
    getSchemas(_req: AuthenticatedRequest, res: Response): Response<any, Record<string, any>>;
}
